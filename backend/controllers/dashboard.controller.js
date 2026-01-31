const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. KPI Stats
    const [
      totalCalls,
      completedCalls,
      activeCustomers,
      revenueResult
    ] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: 'completed' }),
      Customer.countDocuments({ status: 'active' }),
      Customer.aggregate([
        { $group: { _id: null, total: { $sum: "$metadata.lifetimeValue" } } }
      ])
    ]);

    // Calculate Avg Handle Time
    const durationStats = await Conversation.aggregate([
        { $match: { "callDetails.duration": { $gt: 0 } } },
        { $group: { _id: null, avgDuration: { $avg: "$callDetails.duration" } } }
    ]);
    const avgDurationSeconds = durationStats[0]?.avgDuration || 0;
    const avgHandleTime = `${Math.floor(avgDurationSeconds / 60)}:${Math.round(avgDurationSeconds % 60).toString().padStart(2, '0')}`;

    // 2. Activity Chart (Last 24 hours or 7 days)
    // Group by hour for today's data
    const activityStats = await Conversation.aggregate([
        {
            $match: { createdAt: { $gte: today } }
        },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                volume: { $sum: 1 },
                avgConfidence: { $avg: "$aiAnalysis.sentimentScore" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);
    // Fill in missing hours
    const activityData = Array.from({ length: 24 }, (_, i) => {
        const found = activityStats.find(s => s._id === i);
        return {
            time: `${i}:00`,
            performance: (found?.volume || 0) * 10, // Scale for visual
            confidence: Math.round((found?.avgConfidence || 0.85) * 100)
        };
    });

    // 3. Sentiment Distribution (Pie Chart)
    const sentimentStats = await Conversation.aggregate([
        {
            $group: {
                _id: "$aiAnalysis.sentiment",
                count: { $sum: 1 }
            }
        }
    ]);
    const sentimentDistribution = [
        { name: 'Positive', value: 0, fill: '#10b981' }, // emrald-500
        { name: 'Neutral', value: 0, fill: '#6366f1' },  // indigo-500
        { name: 'Negative', value: 0, fill: '#f43f5e' }  // rose-500
    ];
    sentimentStats.forEach(s => {
        const item = sentimentDistribution.find(d => d.name.toLowerCase() === (s._id || 'neutral'));
        if (item) item.value = s.count;
    });

    // 4. Tasks (Escalated/Pending Conversations)
    const tasks = await Conversation.find({ 
        'resolution.status': { $in: ['pending', 'escalated'] } 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customerId', 'name');

    const taskList = tasks.map(t => ({
        id: t._id,
        title: `Follow up: ${t.customerId?.name || 'Unknown'}`,
        status: t.resolution.status,
        priority: t.resolution.status === 'escalated' ? 'high' : 'medium'
    }));

    // 5. Visitors (Channel Distribution)
    const channelStats = await Conversation.aggregate([
        { $group: { _id: "$channel", count: { $sum: 1 } } }
    ]);
    const channels = channelStats.map(c => ({
        platform: c._id || 'Phone',
        visitors: c.count,
        percentage: Math.round((c.count / totalCalls) * 100) || 0,
        color: c._id === 'phone' ? 'bg-indigo-500' : 'bg-emerald-500' 
    }));


    res.json({
        kpi: {
            totalCalls,
            avgHandleTime,
            activeCustomers,
            revenue: revenueResult[0]?.total || 0,
            csat: 4.8 // Hardcoded for now unless stored
        },
        activity: activityData,
        sentiment: sentimentDistribution,
        tasks: taskList,
        channels
    });

  } catch (error) {
    console.error('Values Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

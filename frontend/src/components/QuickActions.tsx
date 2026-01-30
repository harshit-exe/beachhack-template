'use client';

import { 
  Ticket, 
  PhoneForwarded, 
  Mail,
  MessageSquare,
  StickyNote,
  Tag,
  ArrowUpCircle,
  CheckCircle2,
  PhoneOff
} from 'lucide-react';

interface QuickActionsProps {
  isCallActive?: boolean;
  onAction?: (action: string) => void;
  onEndCall?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}

const actions: ActionButton[] = [
  {
    id: 'ticket',
    label: 'Create Ticket',
    icon: <Ticket className="w-5 h-5" />,
    color: 'border-blue-200',
    hoverColor: 'hover:bg-blue-50 hover:border-blue-400'
  },
  {
    id: 'callback',
    label: 'Schedule Callback',
    icon: <PhoneForwarded className="w-5 h-5" />,
    color: 'border-purple-200',
    hoverColor: 'hover:bg-purple-50 hover:border-purple-400'
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'border-green-200',
    hoverColor: 'hover:bg-green-50 hover:border-green-400'
  },
  {
    id: 'whatsapp',
    label: 'Send WhatsApp',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'border-emerald-200',
    hoverColor: 'hover:bg-emerald-50 hover:border-emerald-400'
  },
  {
    id: 'note',
    label: 'Add Note',
    icon: <StickyNote className="w-5 h-5" />,
    color: 'border-amber-200',
    hoverColor: 'hover:bg-amber-50 hover:border-amber-400'
  },
  {
    id: 'tag',
    label: 'Tag Customer',
    icon: <Tag className="w-5 h-5" />,
    color: 'border-cyan-200',
    hoverColor: 'hover:bg-cyan-50 hover:border-cyan-400'
  },
  {
    id: 'escalate',
    label: 'Escalate',
    icon: <ArrowUpCircle className="w-5 h-5" />,
    color: 'border-orange-200',
    hoverColor: 'hover:bg-orange-50 hover:border-orange-400'
  },
  {
    id: 'resolve',
    label: 'Mark Resolved',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'border-green-200',
    hoverColor: 'hover:bg-green-50 hover:border-green-400'
  }
];

export default function QuickActions({ 
  isCallActive = false,
  onAction,
  onEndCall
}: QuickActionsProps) {
  return (
    <div className="h-[10vh] bg-white border-t-2 border-gray-200 px-6 flex items-center justify-between">
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction?.(action.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 
              bg-white border-2 ${action.color} ${action.hoverColor}
              rounded-lg transition-all
              text-gray-700 text-sm font-medium
              shadow-sm hover:shadow
            `}
            title={action.label}
          >
            {action.icon}
            <span className="hidden lg:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* End Call Button */}
      {isCallActive && (
        <button
          onClick={onEndCall}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      )}
    </div>
  );
}

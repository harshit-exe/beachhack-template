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
}

const actions: ActionButton[] = [
  {
    id: 'ticket',
    label: 'Create Ticket',
    icon: <Ticket className="w-4 h-4" />
  },
  {
    id: 'callback',
    label: 'Schedule Callback',
    icon: <PhoneForwarded className="w-4 h-4" />
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />
  },
  {
    id: 'whatsapp',
    label: 'Send WhatsApp',
    icon: <MessageSquare className="w-4 h-4" />
  },
  {
    id: 'note',
    label: 'Add Note',
    icon: <StickyNote className="w-4 h-4" />
  },
  {
    id: 'tag',
    label: 'Tag Customer',
    icon: <Tag className="w-4 h-4" />
  },
  {
    id: 'escalate',
    label: 'Escalate',
    icon: <ArrowUpCircle className="w-4 h-4" />
  },
  {
    id: 'resolve',
    label: 'Mark Resolved',
    icon: <CheckCircle2 className="w-4 h-4" />
  }
];

export default function QuickActions({ 
  isCallActive = false,
  onAction,
  onEndCall
}: QuickActionsProps) {
  return (
    <div className="h-[10vh] bg-white border-t border-slate-100 px-6 flex items-center justify-between">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction?.(action.id)}
            className="
              flex items-center gap-2 px-3 py-2 
              bg-slate-50 border border-slate-100
              hover:bg-[#81d8d0]/10 hover:border-[#81d8d0]
              rounded-lg transition-all
              text-[#0a1128] text-xs font-semibold
            "
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
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl"
        >
          <PhoneOff className="w-4 h-4" />
          End Call
        </button>
      )}
    </div>
  );
}

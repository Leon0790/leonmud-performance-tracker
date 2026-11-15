import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, X } from 'lucide-react';
import { inviteStatus, inviteStatusLabel, INVITE_STATUS_STYLES, canBeActioned } from '@/utils/invites';

/** Invitation list with live statuses and resend / cancel controls. */
export default function InviteList({ invites = [], onResend, onCancel, emptyText = 'No invitations yet.' }) {
  if (!invites.length) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {invites.map((invite) => {
        const status = inviteStatus(invite);
        const actionable = canBeActioned(invite);
        return (
          <div key={invite.id} className="rounded-md border p-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {invite.teacher_name || invite.email}
                <span className="text-muted-foreground font-normal"> · {invite.user_type === 'headteacher' ? 'Headteacher' : 'Teacher'}</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3 h-3" /> {invite.email}
              </p>
              {(invite.grades?.length > 0 || invite.learning_areas?.length > 0) && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {[...(invite.grades || []), ...(invite.learning_areas || [])].join(' · ')}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${INVITE_STATUS_STYLES[status] || INVITE_STATUS_STYLES.pending}`}>
                {inviteStatusLabel(invite)}
              </span>
              {actionable && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 gap-1 text-[11px]" onClick={() => onResend?.(invite)}>
                    <RefreshCw className="w-3 h-3" /> Resend
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 gap-1 text-[11px] text-destructive" onClick={() => onCancel?.(invite)}>
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
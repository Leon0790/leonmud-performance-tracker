export const INVITE_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  claimed: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export const INVITE_STATUS_LABELS = {
  pending: 'Pending',
  claimed: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

/** A pending invitation whose expiry date has passed counts as expired. */
export function inviteStatus(invite) {
  const status = invite?.status || 'pending';
  if (status === 'pending' && invite?.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return 'expired';
  }
  return status;
}

export function inviteStatusLabel(invite) {
  return INVITE_STATUS_LABELS[inviteStatus(invite)] || 'Pending';
}

export function canBeActioned(invite) {
  const status = inviteStatus(invite);
  return status === 'pending' || status === 'expired';
}
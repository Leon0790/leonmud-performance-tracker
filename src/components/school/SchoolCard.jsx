import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MapPin, Users, GraduationCap, CheckCircle2, PauseCircle, UserCog, MoreVertical,
  Link2, Merge, Archive, Eye,
} from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-muted text-muted-foreground border-border',
};

export default function SchoolCard({ school, teacherCount = 0, learnerCount = 0, onInvite, onStatus, onLink, onMerge, onManage }) {
  const status = school.subscription_status || 'pending';
  const archived = status === 'archived';

  return (
    <Card className={archived ? 'opacity-70' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{school.name}</p>
              <Badge variant="outline" className="font-mono text-[11px]">{school.code}</Badge>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                {status}
              </span>
              {school.merged_into && <span className="text-[11px] text-muted-foreground">merged</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {[school.sub_county, school.county].filter(Boolean).join(', ') || 'Location not set'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Headteacher: {school.headteacher_name || '—'}{school.headteacher_email ? ` · ${school.headteacher_email}` : ''}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onLink(school)} className="gap-2">
                <Link2 className="w-4 h-4" /> Link existing account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMerge(school)} className="gap-2">
                <Merge className="w-4 h-4" /> Merge duplicate school
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManage(school)} className="gap-2">
                <Archive className="w-4 h-4" /> Archive / delete school
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {teacherCount} teachers</span>
          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {learnerCount} learners</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/super-admin/schools/${school.id}`}>
              <Eye className="w-3.5 h-3.5" /> View school
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onInvite(school)}>
            <UserCog className="w-3.5 h-3.5" /> Invite headteacher
          </Button>
          {status === 'active' ? (
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => onStatus(school, 'suspended')}>
              <PauseCircle className="w-3.5 h-3.5" /> Suspend
            </Button>
          ) : (
            !archived && (
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onStatus(school, 'active')}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve / activate
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
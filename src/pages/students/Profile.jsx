import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit2, Save, X, Trash2, Upload, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import StudentReportCardButton from '@/components/students/StudentReportCardButton';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9'];
const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Transferred', 'Graduated'];

const statusColor = (s) => {
  if (s === 'Active') return 'bg-green-100 text-green-700';
  if (s === 'Inactive') return 'bg-gray-100 text-gray-600';
  if (s === 'Transferred') return 'bg-amber-100 text-amber-700';
  if (s === 'Graduated') return 'bg-blue-100 text-blue-700';
  return 'bg-muted text-muted-foreground';
};

export default function StudentProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => base44.entities.Teacher.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const profile = teachers[0] || null;

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const list = await base44.entities.StudentRegister.filter({ id });
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (student && !form) setForm({ ...student });
  }, [student]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: async () => {
      let photo_url = form.photo_url;
      if (photoFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        photo_url = file_url;
      }
      return base44.entities.StudentRegister.update(id, { ...form, photo_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['student-register'] });
      toast({ title: 'Student updated!' });
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.StudentRegister.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-register'] });
      toast({ title: 'Student deleted.' });
      navigate('/students/list');
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  if (isLoading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="p-8 text-center text-muted-foreground">
      Student not found. <Link to="/students/list" className="text-indigo-600 underline">Back to list</Link>
    </div>
  );

  const displayPhoto = photoPreview || form?.photo_url || student.photo_url;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/students/list">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="w-14 h-14 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center shrink-0">
            {displayPhoto
              ? <img src={displayPhoto} alt={student.first_name} className="w-full h-full object-cover" />
              : <UserCircle className="w-9 h-9 text-indigo-400" />}
          </div>
          <div>
            <h1 className="text-xl font-bold">{student.first_name} {student.last_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{student.admission_number || 'No Adm#'} · {student.grade}</span>
              <Badge className={`text-xs ${statusColor(student.status)}`}>{student.status || 'Active'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!editing && <StudentReportCardButton student={student} profile={profile} />}
          {editing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ ...student }); setPhotoFile(null); setPhotoPreview(null); }}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove {student.first_name} {student.last_name} from the register.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Photo (edit mode) */}
      {editing && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
              {displayPhoto ? <img src={displayPhoto} alt="" className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('edit-photo-input').click()}>
                <Upload className="w-4 h-4 mr-2" /> Change Photo
              </Button>
              <input id="edit-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </CardContent>
        </Card>
      )}

      <FieldGroup title="Basic Information">
        <Field label="First Name" value={form?.first_name} editing={editing} onChange={v => set('first_name', v)} />
        <Field label="Last Name" value={form?.last_name} editing={editing} onChange={v => set('last_name', v)} />
        <Field label="Admission Number" value={form?.admission_number} editing={editing} onChange={v => set('admission_number', v)} />
        <Field label="Date of Birth" value={form?.date_of_birth} editing={editing} onChange={v => set('date_of_birth', v)} type="date" />
        <SelectField label="Gender" value={form?.gender} editing={editing} onChange={v => set('gender', v)} options={GENDERS} />
        <SelectField label="Status" value={form?.status} editing={editing} onChange={v => set('status', v)} options={STATUSES} />
      </FieldGroup>

      <FieldGroup title="Class Information">
        <SelectField label="Grade" value={form?.grade} editing={editing} onChange={v => set('grade', v)} options={GRADES} />
        <Field label="Class Name" value={form?.class_name} editing={editing} onChange={v => set('class_name', v)} />
        <Field label="Stream" value={form?.stream} editing={editing} onChange={v => set('stream', v)} />
      </FieldGroup>

      <FieldGroup title="Parent / Guardian">
        <Field label="Full Name" value={form?.parent_name} editing={editing} onChange={v => set('parent_name', v)} colSpan />
        <Field label="Phone" value={form?.parent_phone} editing={editing} onChange={v => set('parent_phone', v)} />
        <Field label="Email" value={form?.parent_email} editing={editing} onChange={v => set('parent_email', v)} />
        <Field label="Home Address" value={form?.address} editing={editing} onChange={v => set('address', v)} colSpan />
      </FieldGroup>

      {(editing || student.notes) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            {editing
              ? <textarea className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring" rows={3} value={form?.notes || ''} onChange={e => set('notes', e.target.value)} />
              : <p className="text-sm text-muted-foreground">{student.notes}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value, editing, onChange, type = 'text', colSpan }) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing
        ? <Input className="mt-1" type={type} value={value || ''} onChange={e => onChange(e.target.value)} />
        : <p className="mt-1 text-sm font-medium">{value || '—'}</p>}
    </div>
  );
}

function SelectField({ label, value, editing, onChange, options }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing
        ? <Select value={value || ''} onValueChange={onChange}><SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
        : <p className="mt-1 text-sm font-medium">{value || '—'}</p>}
    </div>
  );
}
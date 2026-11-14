import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Upload, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Transferred', 'Graduated'];

const EMPTY_FORM = {
  first_name: '', last_name: '', admission_number: '', date_of_birth: '',
  gender: '', grade: '', class_name: '', stream: '',
  parent_name: '', parent_phone: '', parent_email: '',
  address: '', status: 'Active', notes: '', photo_url: '',
};

export default function RegisterStudent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let photo_url = form.photo_url;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        photo_url = file_url;
        setIsUploadingPhoto(false);
      }
      return base44.entities.StudentRegister.create({
        ...form,
        photo_url,
        teacher_email: user?.email,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-register'] });
      toast({ title: 'Student registered successfully!' });
      navigate(`/students/${data.id}`);
    },
    onError: () => {
      setIsUploadingPhoto(false);
      toast({ title: 'Failed to register student.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.grade) {
      toast({ title: 'Please fill in required fields.', variant: 'destructive' });
      return;
    }
    createMutation.mutate();
  };

  const isLoading = createMutation.isPending || isUploadingPhoto;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/students/list">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <UserPlus className="w-7 h-7 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">Register Student</h1>
          <p className="text-muted-foreground text-sm">Add a new student to the register</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                : <UserPlus className="w-8 h-8 text-muted-foreground" />}
            </div>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-input').click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Photo
              </Button>
              <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="e.g. John" />
            </div>
            <div>
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="e.g. Doe" />
            </div>
            <div>
              <Label>Admission Number</Label>
              <Input className="mt-1" value={form.admission_number} onChange={e => set('admission_number', e.target.value)} placeholder="e.g. A0012345" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input className="mt-1" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Class Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Class Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Grade <span className="text-destructive">*</span></Label>
              <Select value={form.grade} onValueChange={v => set('grade', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class Name</Label>
              <Input className="mt-1" value={form.class_name} onChange={e => set('class_name', e.target.value)} placeholder="e.g. 7A" />
            </div>
            <div>
              <Label>Stream</Label>
              <Input className="mt-1" value={form.stream} onChange={e => set('stream', e.target.value)} placeholder="e.g. East" />
            </div>
          </CardContent>
        </Card>

        {/* Parent/Guardian */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Full Name</Label>
              <Input className="mt-1" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Parent or guardian name" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="e.g. 07XXXXXXXX" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="parent@email.com" />
            </div>
            <div className="sm:col-span-2">
              <Label>Home Address</Label>
              <Input className="mt-1" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Village / Town / County" />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
          <CardContent>
            <textarea
              className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              placeholder="Any extra information about the student..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/students/list">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Register Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
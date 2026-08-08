import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiAuthenticationServicePost } from "@/services/auth";

export default function PostInternship() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    location: '',
    type: '',
    duration: '',
    stipend: '',
    description: '',
    requirements: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiAuthenticationServicePost('/internships', {
        title: form.title,
        location: form.location,
        type: form.type || 'Full-time',
        duration: form.duration,
        stipend: form.stipend,
        description: form.description,
        requirements: form.requirements,
      });
      toast({ title: "Internship Posted!", description: "Your internship listing is now live." });
      setForm({ title: '', location: '', type: '', duration: '', stipend: '', description: '', requirements: '' });
    } catch (err) {
      toast({ title: "Post failed", description: "Unable to publish the internship right now.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">Post Internship</h2>
        <p className="text-muted-foreground">Create a new internship listing.</p>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Internship Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Job Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Engineering Intern" required /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote / New York" required /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Volunteer">Volunteer</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 months" /></div>
              <div className="space-y-2"><Label>Salary</Label><Input value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="e.g. $5,000/month" /></div>
              <div className="space-y-2"><Label>Application Deadline</Label><Input type="date" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and what interns will learn…" rows={5} required /></div>
            <div className="space-y-2"><Label>Requirements</Label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="List the skills and qualifications required…" rows={3} /></div>
            <Button type="submit" disabled={submitting}>{submitting ? 'Publishing…' : 'Publish Internship'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

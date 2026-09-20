import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, UserCog, CircleAlert } from "lucide-react";
import { useState } from "react";

const coordinators = [
  { name: "Dr. Mercy James", department: "Computer Science", role: "Faculty Coordinator", status: "Active" },
  { name: "Mr. Daniel Smith", department: "Engineering", role: "Department Coordinator", status: "Review" },
  { name: "Prof. Grace Nwosu", department: "Business Administration", role: "Program Lead", status: "Active" },
  { name: "Mrs. Hope Eze", department: "Communications", role: "Department Coordinator", status: "Pending" },
];

export default function FacultyCoordinatorManagement() {
  const [search, setSearch] = useState("");

  const filtered = coordinators.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(keyword) ||
      item.department.toLowerCase().includes(keyword) ||
      item.role.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Coordinator management</h2>
          <p className="text-muted-foreground">Manage faculty coordinators, department leads, and team access.</p>
        </div>
        <Button size="sm">Invite coordinator</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Active coordinators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">18</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Pending assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">6</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CircleAlert className="h-4 w-4" />
              Attention needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">4</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coordinators..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No coordinator found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((person) => (
                  <TableRow key={person.name}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.department}</TableCell>
                    <TableCell>{person.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          person.status === "Active"
                            ? "default"
                            : person.status === "Review"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {person.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

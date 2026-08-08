import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Ban, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { apiAuthenticationServiceGet, apiAuthenticationServicePut } from "@/services/auth";

interface PlatformUser {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "RECRUITER" | "ADMIN";
  suspended: boolean;
}

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthenticationServiceGet("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSuspend = async (u: PlatformUser) => {
    try {
      setUpdatingId(u.id);
      await apiAuthenticationServicePut(`/users/${u.id}`, { suspended: !u.suspended });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, suspended: !u.suspended } : x)));
    } catch (err) {
      console.error("Failed to update user:", err);
      setError("Failed to update user status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading users…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold">Manage Users</h2>
        <p className="text-muted-foreground">View and manage all platform users.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{u.role.toLowerCase()}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.suspended ? "destructive" : "default"} className="capitalize">
                        {u.suspended ? "suspended" : "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : u.suspended ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:text-success"
                          onClick={() => toggleSuspend(u)}
                          disabled={updatingId === u.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => toggleSuspend(u)}
                          disabled={updatingId === u.id}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
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
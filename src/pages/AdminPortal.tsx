import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, LogOut, CheckCircle, Clock } from 'lucide-react';

const AdminPortal: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const { toast } = useToast();

    // The hardcoded admin email
    const ADMIN_EMAIL = 'priyangshu713@gmail.com';

    useEffect(() => {
        checkAdminSession();
    }, []);

    const checkAdminSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.email === ADMIN_EMAIL) {
            setIsAuthenticated(true);
            fetchDoctors();
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            if (data.user && data.user.email === ADMIN_EMAIL) {
                setIsAuthenticated(true);
                toast({ title: 'Welcome Admin' });
                fetchDoctors();
            } else {
                // Not the admin, sign them out immediately
                await supabase.auth.signOut();
                toast({ title: 'Unauthorized', variant: 'destructive' });
            }
        } catch (error: any) {
            toast({
                title: 'Login Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setEmail('');
        setPassword('');
        setDoctors([]);
    };

    const fetchDoctors = async () => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching doctors:', error);
            toast({ title: 'Failed to fetch doctors', variant: 'destructive' });
        } else {
            setDoctors(data || []);
        }
    };

    const approveDoctor = async (doctorId: string) => {
        const { error } = await supabase
            .from('doctors')
            .update({ is_approved: true })
            .eq('id', doctorId);

        if (error) {
            toast({ title: 'Error approving doctor', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Doctor Approved Successfully' });
            fetchDoctors(); // Refresh list
        }
    };

    const rejectDoctor = async (doctorId: string) => {
        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', doctorId);

        if (error) {
            toast({ title: 'Error rejecting doctor', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Doctor Rejected and Removed' });
            fetchDoctors(); // Refresh list
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pt-24 px-4 bg-muted/30 flex justify-center items-start">
                <Card className="w-full max-w-md mt-12 shadow-xl border-primary/20">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold font-heading text-primary">Admin Control Panel</CardTitle>
                        <CardDescription>Restricted access</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Email</label>
                                <Input 
                                    type="email"
                                    placeholder="Enter admin email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input 
                                    type="password" 
                                    placeholder="Enter admin password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Authenticating...' : 'Secure Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const pendingDoctors = doctors.filter(d => !d.is_approved);
    const approvedDoctors = doctors.filter(d => d.is_approved);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-muted/10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-card p-6 rounded-lg shadow-sm border">
                    <div>
                        <h1 className="text-3xl font-bold font-heading text-primary">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage doctor registrations and platform access</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="gap-2">
                        <LogOut className="h-4 w-4" /> Logout Admin
                    </Button>
                </div>

                <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                        <TabsTrigger value="pending">
                            Pending Approvals ({pendingDoctors.length})
                        </TabsTrigger>
                        <TabsTrigger value="approved">
                            Active Doctors ({approvedDoctors.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        {pendingDoctors.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-card rounded-lg border">
                                <CheckCircle className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-muted-foreground">No pending approvals</h3>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pendingDoctors.map(doctor => (
                                    <DoctorAdminCard 
                                        key={doctor.id} 
                                        doctor={doctor} 
                                        onApprove={() => approveDoctor(doctor.id)}
                                        onReject={() => rejectDoctor(doctor.id)}
                                        isPending={true}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="approved" className="space-y-4">
                        {approvedDoctors.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-card rounded-lg border">
                                <h3 className="text-lg font-medium text-muted-foreground">No approved doctors yet</h3>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {approvedDoctors.map(doctor => (
                                    <DoctorAdminCard 
                                        key={doctor.id} 
                                        doctor={doctor} 
                                        onReject={() => rejectDoctor(doctor.id)}
                                        isPending={false}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

// Sub-component for displaying a doctor in the admin panel
const DoctorAdminCard = ({ doctor, onApprove, onReject, isPending }: { doctor: any, onApprove?: () => void, onReject: () => void, isPending: boolean }) => (
    <Card className={`border-l-4 ${isPending ? 'border-l-amber-500' : 'border-l-green-500'}`}>
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold font-heading">Dr. {doctor.first_name} {doctor.last_name}</h3>
                        {isPending ? (
                            <span className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <Clock className="w-3 h-3 mr-1" /> Pending
                            </span>
                        ) : (
                            <span className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
                        <div><strong className="text-muted-foreground">Email (Auth):</strong> {doctor.email}</div>
                        <div><strong className="text-muted-foreground">Specialty:</strong> {doctor.specialty}</div>
                        <div><strong className="text-muted-foreground">Hospital:</strong> {doctor.hospital}</div>
                        <div><strong className="text-muted-foreground">Location:</strong> {doctor.location}</div>
                        <div><strong className="text-muted-foreground">Phone:</strong> {doctor.contact_phone}</div>
                        <div><strong className="text-muted-foreground">Experience:</strong> {doctor.experience} Years</div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-muted/40 rounded-md border">
                        <h4 className="text-sm font-semibold mb-2">Proof of Qualification</h4>
                        <p className="text-sm break-all font-mono text-primary">
                            {doctor.proof_document || <span className="text-muted-foreground italic">No proof provided</span>}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    {isPending && onApprove && (
                        <Button onClick={onApprove} className="w-full md:w-32 bg-green-600 hover:bg-green-700 text-white">
                            <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                    )}
                    <Button onClick={onReject} variant="destructive" className="w-full md:w-32">
                        <X className="w-4 h-4 mr-2" /> {isPending ? 'Reject' : 'Remove'}
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default AdminPortal;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, User, ShieldCheck, Mail, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';

const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
];

const UnifiedLogin = () => {
    const navigate = useNavigate();
    const { unifiedLogin, userSession, guestSession, staffSession } = useHotel();
    const { toast } = useToast();

    useEffect(() => {
        if (userSession) {
            if (guestSession) {
                navigate('/guest/dashboard');
            } else if (staffSession) {
                const role = staffSession.user.role;
                if (role === 'admin') navigate('/admin/dashboard');
                else navigate('/reception/dashboard');
            }
        }
    }, [userSession, guestSession, staffSession, navigate]);

    const [loading, setLoading] = useState(false);

    // Staff state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Guest state
    const [docType, setDocType] = useState('CC');
    const [docNumber, setDocNumber] = useState('');

    const handleStaffLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await unifiedLogin({ identifier: email, password });

        if (res.success) {
            toast({ title: '¡Bienvenido!', description: 'Acceso concedido al personal.' });
            if (res.role === 'admin') navigate('/admin/dashboard');
            else navigate('/reception/dashboard');
        } else {
            toast({
                title: 'Error de acceso',
                description: res.message || 'Credenciales inválidas.',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await unifiedLogin({ identifier: docNumber, documentType: docType });

        if (res.success) {
            toast({ title: '¡Bienvenido!', description: 'Has ingresado como huésped.' });
            navigate('/guest/dashboard');
        } else {
            toast({
                title: 'Error de reserva',
                description: res.message || 'No se encontró una reserva activa.',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-primary/20">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
                        <Hotel className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Hotel Robles</CardTitle>
                    <CardDescription>
                        Selecciona tu tipo de acceso para ingresar al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="guest" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="guest" className="flex items-center gap-2">
                                <User className="h-4 w-4" /> Huésped
                            </TabsTrigger>
                            <TabsTrigger value="staff" className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Personal
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="guest">
                            <form onSubmit={handleGuestLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="docType">Tipo de Documento</Label>
                                    <Select value={docType} onValueChange={setDocType}>
                                        <SelectTrigger id="docType">
                                            <SelectValue placeholder="Seleccione tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="docNumber">Número de Documento</Label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="docNumber"
                                            placeholder="1234567890"
                                            className="pl-10"
                                            value={docNumber}
                                            onChange={(e) => setDocNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full group" size="lg" disabled={loading}>
                                    {loading ? 'Verificando...' : (
                                        <>
                                            Ingresar como Huésped <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="staff">
                            <form onSubmit={handleStaffLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Institucional</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="usuario@hotelrobles.com"
                                            className="pl-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="secondary" className="w-full group" size="lg" disabled={loading}>
                                    {loading ? 'Autenticando...' : (
                                        <>
                                            Acceso Personal <ShieldCheck className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </Button>
                                <div className="p-3 bg-muted rounded-lg text-center space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cuentas Demo</p>
                                    <p className="text-xs font-mono">admin@robles.com / admin123</p>
                                    <p className="text-xs font-mono">recepcion@robles.com / recepcion123</p>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default UnifiedLogin;

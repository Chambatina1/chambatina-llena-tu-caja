'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  Plus,
  Search,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  formatCurrency,
  formatDate,
  US_STATES_LIST,
  type LLCFilingResponse,
} from '@/lib/llc-utils';

interface DashboardProps {
  onNewFiling: () => void;
  onViewFiling: (id: string) => void;
}

export default function LLCDashboard({ onNewFiling, onViewFiling }: DashboardProps) {
  const [filings, setFilings] = useState<LLCFilingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchFilings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterState !== 'all') params.set('state', filterState);
      const res = await fetch(`/api/llc/filings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFilings(data);
      }
    } catch (err) {
      console.error('Error fetching filings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilings();
  }, [filterStatus, filterState]);

  const filtered = filings.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.llcName.toLowerCase().includes(q) ||
      f.stateCode.toLowerCase().includes(q) ||
      (f.clientName || '').toLowerCase().includes(q) ||
      (f.assignedTo || '').toLowerCase().includes(q)
    );
  });

  const totalFilings = filings.length;
  const pendingReview = filings.filter((f) => f.status === 'draft' || f.status === 'review').length;
  const signedCount = filings.filter((f) => f.status === 'signed').length;
  const filedCount = filings.filter((f) => f.status === 'filed').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalFilings}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950/40 dark:to-orange-900/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingReview}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950/40 dark:to-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{signedCount}</p>
              <p className="text-xs text-muted-foreground">Firmados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/40 dark:to-purple-900/40 flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{filedCount}</p>
              <p className="text-xs text-muted-foreground">Presentados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="review">En Revisión</SelectItem>
              <SelectItem value="client_reviewed">Revisado</SelectItem>
              <SelectItem value="signed">Firmado</SelectItem>
              <SelectItem value="filed">Presentado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado US" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {US_STATES_LIST.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onNewFiling} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nueva Presentación
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Presentaciones de LLC</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron presentaciones</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onNewFiling}>
                Crear nueva presentación
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre LLC</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Asignado a</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((filing) => (
                    <TableRow
                      key={filing.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onViewFiling(filing.id)}
                    >
                      <TableCell className="font-medium">{filing.llcName}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[filing.status] || ''}>
                          {STATUS_LABELS[filing.status] || filing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{filing.stateCode}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {filing.assignedTo || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(filing.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onViewFiling(filing.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

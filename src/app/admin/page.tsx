'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Package,
  ShoppingCart,
  User,
  Mail,
  Phone,
  Clock,
  BoxIcon,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
  Store,
  ClipboardList,
  DollarSign,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  weight: number;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  boxSize: string;
  items: OrderItem[];
  productCost: number;
  walmartTax: number;
  shippingCost: number;
  managementFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentToken: string | null;
  qbTransactionId: string | null;
  qbPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pendiente',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: 'Procesando',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  purchased: {
    label: 'Comprado en Walmart',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700',
    icon: <Store className="w-3.5 h-3.5" />,
  },
  shipped: {
    label: 'Enviado',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: 'Entregado',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shoppingListDialog, setShoppingListDialog] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderId.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = statusCounts.pending || 0;
  const purchasedCount = statusCounts.purchased || 0;

  const handlePrintShoppingList = (order: Order) => {
    const itemsList = order.items
      .map(item => `- ${item.name} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})`)
      .join('\n');
    const text = `
WALMART — LISTA DE COMPRA
==========================
Orden: ${order.orderId}
Fecha: ${formatDate(order.createdAt)}
Cliente: ${order.customerName}
Email: ${order.customerEmail}
Telefono: ${order.customerPhone}
Caja: ${order.boxSize}

PRODUCTOS A COMPRAR:
${itemsList}

---
Resumen:
- Productos: $${order.productCost.toFixed(2)}
- Tax Walmart (7%): $${order.walmartTax.toFixed(2)}
- Envio: $${order.shippingCost.toFixed(2)}
- Gestion: $${order.managementFee.toFixed(2)}
- TOTAL: $${order.totalAmount.toFixed(2)}
    `.trim();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;">${text}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/30 dark:from-background dark:to-orange-950/10">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md"
            >
              C
            </Link>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                Chambatina
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Panel de Administracion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-muted-foreground">Total Pedidos</span>
            </div>
            <p className="text-2xl font-extrabold">{orders.length}</p>
          </Card>
          <Card className="p-4 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-extrabold">{pendingCount}</p>
          </Card>
          <Card className="p-4 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-muted-foreground">Por Comprar</span>
            </div>
            <p className="text-2xl font-extrabold">{purchasedCount}</p>
          </Card>
          <Card className="p-4 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">Ingresos</span>
            </div>
            <p className="text-2xl font-extrabold">${totalRevenue.toFixed(2)}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por orden, nombre, email o telefono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({statusCounts.all})</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label} ({statusCounts[key] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold">No hay pedidos</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron pedidos con los filtros aplicados. Intenta ajustar la busqueda.'
                  : 'Aun no se han recibido pedidos de Walmart a tu Familia. Los pedidos aparecen aqui cuando los clientes completan una compra.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const isExpanded = expandedOrder === order.id;
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const totalWeight = order.items.reduce((sum, item) => sum + item.weight * item.quantity, 0);

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden border hover:shadow-md transition-shadow">
                    {/* Order Header - Clickable */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full p-4 text-left flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Status Badge */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${statusConfig.bgColor}`}>
                        <span className={statusConfig.color}>{statusConfig.icon}</span>
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm">{order.orderId}</span>
                          <Badge variant="outline" className={`text-[10px] border ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {order.customerName} — {order.customerEmail}
                        </p>
                      </div>

                      {/* Amount & Date */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>

                      {/* Expand Arrow */}
                      <div className="shrink-0 ml-2">
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <Separator />
                          <div className="p-4 space-y-4">
                            {/* Customer Info */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                Datos del Cliente
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground">Nombre</p>
                                    <p className="text-sm font-medium truncate">{order.customerName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium truncate">{order.customerEmail}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground">Telefono</p>
                                    <p className="text-sm font-medium truncate">{order.customerPhone}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Product List - Walmart Shopping List */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <Store className="w-3.5 h-3.5" />
                                  Lista de Compra Walmart
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] gap-1"
                                    onClick={() => handlePrintShoppingList(order)}
                                  >
                                    <Printer className="w-3 h-3" />
                                    Imprimir
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 text-[10px] gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                    onClick={() => setShoppingListDialog(order)}
                                  >
                                    <ClipboardList className="w-3 h-3" />
                                    Ver Lista Completa
                                  </Button>
                                </div>
                              </div>
                              <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                                <ScrollArea style={{ maxHeight: '200px' }}>
                                  <div className="p-2">
                                    {order.items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between py-1.5 border-b border-orange-200/50 dark:border-orange-800/30 last:border-0"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                                          <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                              {item.weight} lb x {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-sm font-bold shrink-0">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </Card>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{order.items.length} productos</span>
                                <span>Peso total: {totalWeight.toFixed(1)} lbs</span>
                                <span>Caja: {order.boxSize}</span>
                              </div>
                            </div>

                            <Separator />

                            {/* Cost Breakdown */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5" />
                                Desglose de Costos
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                  <p className="text-[10px] text-muted-foreground">Productos</p>
                                  <p className="text-sm font-bold">${order.productCost.toFixed(2)}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                    Tax Walmart
                                  </p>
                                  <p className="text-sm font-bold">${order.walmartTax.toFixed(2)}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                    <Truck className="w-2.5 h-2.5" />
                                    Envio
                                  </p>
                                  <p className="text-sm font-bold">${order.shippingCost.toFixed(2)}</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                    <FileText className="w-2.5 h-2.5" />
                                    Gestion
                                  </p>
                                  <p className="text-sm font-bold">${order.managementFee.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-2">
                                  <span className="text-xs text-muted-foreground mr-2">TOTAL:</span>
                                  <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">${order.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Status Management */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BoxIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium">Actualizar estado:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {updatingStatus === order.id && (
                                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                )}
                                <Select
                                  value={order.status}
                                  onValueChange={(val) => handleStatusChange(order.id, val)}
                                  disabled={updatingStatus === order.id}
                                >
                                  <SelectTrigger className="w-44 h-9 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>
                                        {config.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Transaction IDs */}
                            {(order.qbTransactionId || order.qbPaymentId) && (
                              <div className="text-[10px] text-muted-foreground space-y-0.5">
                                {order.qbTransactionId && (
                                  <p>TXN: <span className="font-mono">{order.qbTransactionId}</span></p>
                                )}
                                {order.qbPaymentId && (
                                  <p>PAY: <span className="font-mono">{order.qbPaymentId}</span></p>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Shopping List Dialog */}
      <Dialog open={!!shoppingListDialog} onOpenChange={() => setShoppingListDialog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              Lista de Compra Walmart
            </DialogTitle>
            <DialogDescription>
              Productos a comprar para el pedido {shoppingListDialog?.orderId}
            </DialogDescription>
          </DialogHeader>

          {shoppingListDialog && (
            <div className="space-y-4">
              {/* Customer Summary */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span className="font-medium">{shoppingListDialog.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{shoppingListDialog.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{shoppingListDialog.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BoxIcon className="w-3.5 h-3.5" />
                  <span>Caja: {shoppingListDialog.boxSize}</span>
                </div>
              </div>

              {/* Shopping List */}
              <ScrollArea style={{ maxHeight: '300px' }}>
                <div className="space-y-0">
                  {shoppingListDialog.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.weight} lb — ${item.price.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        <p className="text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
                <span className="font-bold text-sm">Total a pagar en Walmart:</span>
                <span className="font-extrabold text-lg text-orange-600 dark:text-orange-400">
                  ${(shoppingListDialog.productCost + shoppingListDialog.walmartTax).toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs gap-1.5"
                  onClick={() => handlePrintShoppingList(shoppingListDialog)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Lista
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

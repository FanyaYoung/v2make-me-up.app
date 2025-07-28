import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, ExternalLink, Eye, Edit, Search } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  customer_email: string;
  customer_name: string;
  shipping_address: any;
  affiliate_id: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_carrier?: string;
  notes?: string;
  created_at: string;
  shipped_at?: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  product_brand: string;
  shade_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingData, setShippingData] = useState({
    tracking_number: '',
    shipping_carrier: '',
    tracking_url: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateShipping = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-shipping', {
        body: {
          order_id: orderId,
          ...shippingData
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipping information updated successfully"
      });

      fetchOrders();
      setSelectedOrder(null);
      setShippingData({ tracking_number: '', shipping_carrier: '', tracking_url: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shipping information",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button onClick={fetchOrders} variant="outline">
          Refresh Orders
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by order number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {order.order_number}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Customer</Label>
                            <p>{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          </div>
                          <div>
                            <Label>Total Amount</Label>
                            <p className="text-lg font-semibold">${order.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Affiliate ID</Label>
                          <p className="font-mono">{order.affiliate_id}</p>
                        </div>

                        <div>
                          <Label>Shipping Address</Label>
                          <div className="text-sm">
                            <p>{order.shipping_address.line1}</p>
                            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                            <p>{order.shipping_address.country}</p>
                          </div>
                        </div>

                        <div>
                          <Label>Order Items</Label>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between p-2 border rounded">
                                <div>
                                  <p className="font-medium">{item.product_brand} - {item.product_name}</p>
                                  {item.shade_name && <p className="text-sm text-muted-foreground">Shade: {item.shade_name}</p>}
                                  <p className="text-sm">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.tracking_number && (
                          <div>
                            <Label>Tracking Information</Label>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{order.tracking_number}</span>
                              {order.tracking_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(order.tracking_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Track Package
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">Carrier: {order.shipping_carrier}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="text-lg font-semibold">${order.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="mt-4 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedOrder(order)}>
                        <Truck className="h-4 w-4 mr-2" />
                        Add Shipping Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Shipping Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tracking">Tracking Number</Label>
                          <Input
                            id="tracking"
                            value={shippingData.tracking_number}
                            onChange={(e) => setShippingData({...shippingData, tracking_number: e.target.value})}
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="carrier">Shipping Carrier</Label>
                          <Select 
                            value={shippingData.shipping_carrier} 
                            onValueChange={(value) => setShippingData({...shippingData, shipping_carrier: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UPS">UPS</SelectItem>
                              <SelectItem value="FedEx">FedEx</SelectItem>
                              <SelectItem value="USPS">USPS</SelectItem>
                              <SelectItem value="DHL">DHL</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tracking-url">Custom Tracking URL (Optional)</Label>
                          <Input
                            id="tracking-url"
                            value={shippingData.tracking_url}
                            onChange={(e) => setShippingData({...shippingData, tracking_url: e.target.value})}
                            placeholder="Custom tracking URL"
                          />
                        </div>
                        <Button 
                          onClick={() => updateShipping(order.id)}
                          className="w-full"
                          disabled={!shippingData.tracking_number || !shippingData.shipping_carrier}
                        >
                          Update Shipping Information
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {order.tracking_number && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Tracking</Label>
                      <p className="font-mono">{order.tracking_number}</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_carrier}</p>
                    </div>
                    {order.tracking_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(order.tracking_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track Package
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOrderManagement;
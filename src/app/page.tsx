'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  ShoppingCart, 
  IceCream, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  User,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Button from '@/components/ui/button';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Mock statistics data
  const stats = [
    { label: 'Total Revenue', value: '$12,450.00', change: '+15.2%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Kiosks', value: '8 / 10', change: '80% Online', icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Orders Today', value: '142', change: '+8.4%', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Critical Alerts', value: '1', change: 'Action Required', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  // Mock kiosks data
  const kiosks = [
    { id: 'K-001', name: 'Kiosk FPT Campus', location: 'District 9, HCMC', status: 'online', stock: 92, cups: 120 },
    { id: 'K-002', name: 'Kiosk Landmark 81', location: 'Binh Thanh, HCMC', status: 'online', stock: 45, cups: 85 },
    { id: 'K-003', name: 'Kiosk Gigamall', location: 'Thu Duc, HCMC', status: 'maintenance', stock: 0, cups: 10 },
    { id: 'K-004', name: 'Kiosk Estella Place', location: 'District 2, HCMC', status: 'offline', stock: 78, cups: 95 },
  ];

  // Mock recent orders
  const recentOrders = [
    { id: 'ORD-9874', kiosk: 'Kiosk Landmark 81', items: '2x Matcha Special', amount: '$8.50', status: 'success', time: '5 mins ago' },
    { id: 'ORD-9873', kiosk: 'Kiosk FPT Campus', items: '1x Chocolate Mint', amount: '$4.00', status: 'success', time: '12 mins ago' },
    { id: 'ORD-9872', kiosk: 'Kiosk Gigamall', items: '1x Vanilla Strawberry', amount: '$4.50', status: 'failed', time: '20 mins ago' },
    { id: 'ORD-9871', kiosk: 'Kiosk Estella Place', items: '3x Premium Coconut', amount: '$13.50', status: 'pending', time: '25 mins ago' },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <IceCream size={20} className="animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider text-white">ICEBOT</span>
              <span className="text-xs block text-slate-400 font-medium">ADMIN PORTAL</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-6 px-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'kiosks', label: 'Kiosks Management', icon: Monitor },
              { id: 'orders', label: 'Orders & Sales', icon: ShoppingCart },
              { id: 'products', label: 'Product Catalog', icon: IceCream },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-colors">
            <Settings size={18} />
            System Settings
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          {/* Search bar */}
          <div className="relative w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search kiosks, orders, settings..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg relative transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-800"></div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center justify-center font-bold text-sm">
                AD
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-medium block text-white">Admin User</span>
                <span className="text-xs text-slate-400 block">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
          {/* Page Title & Refresh */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white capitalize">{activeTab}</h1>
              <p className="text-sm text-slate-400">Welcome back! Here is a summary of the IceBot system.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="gap-2 h-9 border-slate-800 hover:bg-slate-800 dark:border-slate-800"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button variant="primary" size="sm" className="gap-2 h-9 bg-indigo-600 hover:bg-indigo-700">
                <Plus size={14} />
                Add Kiosk
              </Button>
            </div>
          </div>

          {/* Content corresponding to active tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-slate-950/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 transition-all duration-300 hover:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                        <span className="text-xs font-semibold text-emerald-400">{stat.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid 2: Kiosks & Orders */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Kiosk Status Table */}
                <div className="xl:col-span-2 bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Kiosks Overview</h2>
                    <Button variant="outline" size="sm" className="text-xs border-slate-800 py-1 h-8">View All</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/20">
                          <th className="px-6 py-3">ID</th>
                          <th className="px-6 py-3">Kiosk Name</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Ice Cream Stock</th>
                          <th className="px-6 py-3">Cup Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {kiosks.map((kiosk) => (
                          <tr key={kiosk.id} className="hover:bg-slate-950/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-semibold">{kiosk.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-white">{kiosk.name}</div>
                              <div className="text-xs text-slate-400">{kiosk.location}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                kiosk.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                kiosk.status === 'offline' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  kiosk.status === 'online' ? 'bg-emerald-500' :
                                  kiosk.status === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
                                }`}></span>
                                {kiosk.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{kiosk.stock}%</span>
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${kiosk.stock < 20 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${kiosk.stock}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{kiosk.cups} pcs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Recent Orders */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Activity</h2>
                    <ShoppingCart size={16} className="text-slate-400" />
                  </div>
                  <div className="p-6 space-y-6">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex justify-between items-start text-sm border-b border-slate-800/40 pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{order.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium capitalize ${
                              order.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                              order.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{order.kiosk}</p>
                          <p className="text-xs text-slate-300 italic">{order.items}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white block">{order.amount}</span>
                          <span className="text-xs text-slate-500 block">{order.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-12 text-center">
              <IceCream size={48} className="mx-auto text-slate-600 mb-4 animate-pulse" />
              <h2 className="text-lg font-bold text-white mb-2">Module is under development</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">The {activeTab} feature is being scaffolded under the feature-based folder structure.</p>
              <Button variant="primary" size="sm" onClick={() => setActiveTab('dashboard')}>Back to Dashboard</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

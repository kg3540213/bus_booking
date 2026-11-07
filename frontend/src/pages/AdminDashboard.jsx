import React, { useState, useEffect } from 'react';
import {
  Shield, Bus, MapPin, Calendar, Users, DollarSign,
  TrendingUp, Plus, Activity, CheckCircle, RefreshCw, AlertCircle
} from 'lucide-react';
import { reportsApi, auditApi, busesApi, routesApi, operatorsApi, tripsApi } from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Overview Data
  const [summary, setSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  // Data sets
  const [operators, setOperators] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals & Forms
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [newOp, setNewOp] = useState({ name: '', code: '', contact_email: '', contact_phone: '', address: '' });

  const [showAddBus, setShowAddBus] = useState(false);
  const [newBus, setNewBus] = useState({ operator_id: 1, bus_number: '', model: '', bus_type: 'AC_SLEEPER', total_seats: 30 });

  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({ bus_id: 1, route_id: 1, departure_time: '', arrival_time: '', base_fare: 1200 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, opRes, busRes, routeRes, occRes, auditRes] = await Promise.all([
        reportsApi.getDashboard().catch(() => ({ data: {} })),
        operatorsApi.getAll().catch(() => ({ data: [] })),
        busesApi.getAll().catch(() => ({ data: [] })),
        routesApi.getAll().catch(() => ({ data: [] })),
        reportsApi.getOccupancy().catch(() => ({ data: [] })),
        auditApi.getLogs({ limit: 30 }).catch(() => ({ data: [] })),
      ]);

      if (dashRes.data?.summary) setSummary(dashRes.data.summary);
      if (dashRes.data?.recent_bookings) setRecentBookings(dashRes.data.recent_bookings);
      if (opRes.data) setOperators(opRes.data);
      if (busRes.data) setBuses(busRes.data);
      if (routeRes.data) setRoutes(routeRes.data);
      if (occRes.data) setOccupancy(occRes.data);
      if (auditRes.data) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    try {
      const res = await operatorsApi.create(newOp);
      if (res.success) {
        setShowAddOperator(false);
        setNewOp({ name: '', code: '', contact_email: '', contact_phone: '', address: '' });
        loadDashboardData();
      }
    } catch (err) {
      alert('Error creating operator: ' + err.message);
    }
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      const res = await busesApi.create({
        ...newBus,
        operator_id: parseInt(newBus.operator_id, 10),
        total_seats: parseInt(newBus.total_seats, 10),
      });
      if (res.success) {
        setShowAddBus(false);
        setNewBus({ operator_id: 1, bus_number: '', model: '', bus_type: 'AC_SLEEPER', total_seats: 30 });
        loadDashboardData();
      }
    } catch (err) {
      alert('Error creating bus: ' + err.message);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await tripsApi.create({
        ...newTrip,
        bus_id: parseInt(newTrip.bus_id, 10),
        route_id: parseInt(newTrip.route_id, 10),
        base_fare: parseFloat(newTrip.base_fare),
        departure_time: new Date(newTrip.departure_time).toISOString(),
        arrival_time: new Date(newTrip.arrival_time).toISOString(),
      });
      if (res.success) {
        setShowAddTrip(false);
        loadDashboardData();
      }
    } catch (err) {
      alert('Error scheduling trip: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Staff & Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            System Administration Console
          </h1>
          <p className="text-xs text-slate-500">
            Full operational management of operators, fleet buses, routes, schedules, occupancy, and audit trail.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Dashboard & KPI Summary', icon: TrendingUp },
          { id: 'operators', label: 'Operators & Fleet', icon: Bus },
          { id: 'routes', label: 'Routes & Schedules', icon: MapPin },
          { id: 'occupancy', label: 'Fleet Occupancy Reports', icon: Activity },
          { id: 'audit', label: 'Material Audit Trail', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Bookings Revenue</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">₹</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                ₹{summary?.gross_revenue?.toLocaleString() || 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Confirmed transactions</div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Realized Revenue</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">₹</span>
              </div>
              <div className="text-2xl font-black text-blue-600 mt-2 font-mono">
                ₹{summary?.net_revenue?.toLocaleString() || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                After ₹{summary?.total_refunds?.toLocaleString() || 0} processed refunds
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Bookings</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">🎫</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {summary?.confirmed_bookings || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {summary?.cancelled_bookings || 0} cancelled reservations
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Fleet / Trips</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">🚍</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {summary?.total_buses || 0} Buses
              </div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">
                {summary?.total_trips || 0} active schedules
              </div>
            </div>
          </div>

          {/* Recent Bookings Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Real-Time Bookings Feed</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">PNR</th>
                    <th className="py-2.5 px-4">Passenger Contact</th>
                    <th className="py-2.5 px-4">Route</th>
                    <th className="py-2.5 px-4">Operator</th>
                    <th className="py-2.5 px-4">Total Fare</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{b.pnr}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{b.primary_contact_name}</td>
                      <td className="py-2.5 px-4">{b.source_city} → {b.destination_city}</td>
                      <td className="py-2.5 px-4 text-slate-500">{b.operator_name}</td>
                      <td className="py-2.5 px-4 font-bold font-mono">₹{Math.round(b.total_fare)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operators & Fleet */}
      {activeTab === 'operators' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Operators */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Bus Operators ({operators.length})</h3>
              <button
                onClick={() => setShowAddOperator(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Operator
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {operators.map(op => (
                <div key={op.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-slate-900 text-sm">{op.name}</span>
                    <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] font-mono font-bold">{op.code}</span>
                  </div>
                  <div className="text-xs text-slate-500">{op.contact_email} • {op.contact_phone}</div>
                  <div className="text-[11px] text-slate-400">{op.address}</div>
                  <div className="pt-2 border-t border-slate-200 text-xs font-semibold text-blue-600">
                    {op.total_buses || 0} Fleet Vehicles Assigned
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Vehicles */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Fleet Buses ({buses.length})</h3>
              <button
                onClick={() => setShowAddBus(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Register Bus
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Bus Registration</th>
                    <th className="py-2.5 px-4">Model</th>
                    <th className="py-2.5 px-4">Operator</th>
                    <th className="py-2.5 px-4">Coach Type</th>
                    <th className="py-2.5 px-4">Seats</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {buses.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{b.bus_number}</td>
                      <td className="py-2.5 px-4 font-semibold">{b.model}</td>
                      <td className="py-2.5 px-4 text-slate-500">{b.operator_name}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[10px]">
                          {b.bus_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{b.total_seats} berths</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Routes & Schedules */}
      {activeTab === 'routes' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Active Routes ({routes.length})</h3>
              <button
                onClick={() => setShowAddTrip(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule New Trip
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map(r => (
                <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-slate-900 text-sm">
                      {r.source_city} → {r.destination_city}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                      {r.distance_km} km
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Est. Duration: {Math.floor(r.estimated_duration_mins / 60)}h {r.estimated_duration_mins % 60}m
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-600 mb-1">Stops Sequence:</div>
                    <div className="flex flex-wrap gap-1">
                      {(r.stops || []).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600">
                          {s.sequence_order}. {s.stop_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Fleet Occupancy Reports */}
      {activeTab === 'occupancy' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Fleet Capacity & Occupancy Utilization Report</h3>
              <p className="text-xs text-slate-500">Live seat bookings reconciled against vehicle capacities</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Trip Schedule</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Bus & Coach</th>
                  <th className="py-2.5 px-4">Operator</th>
                  <th className="py-2.5 px-4">Booked / Total</th>
                  <th className="py-2.5 px-4">Occupancy %</th>
                  <th className="py-2.5 px-4">Confirmed Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {occupancy.map(occ => (
                  <tr key={occ.trip_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {new Date(occ.departure_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-4">{occ.source_city} → {occ.destination_city}</td>
                    <td className="py-2.5 px-4 font-mono">{occ.bus_number} ({occ.bus_type})</td>
                    <td className="py-2.5 px-4 text-slate-500">{occ.operator_name}</td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className="text-blue-600">{occ.booked_seats}</span> / {occ.total_seats}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              occ.occupancy_percentage > 75 ? 'bg-emerald-500' :
                              occ.occupancy_percentage > 40 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${occ.occupancy_percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{occ.occupancy_percentage}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                      ₹{Math.round(occ.confirmed_revenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Material Business Action Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable log of security-sensitive operations, bookings, cancellations and modifications</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Changes Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('CANCEL') ? 'bg-red-100 text-red-800' :
                        log.action.includes('BOOKING') ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{log.entity_type} #{log.entity_id}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">
                      {log.user_email ? `${log.user_name} (${log.user_role})` : 'System Daemon'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-2.5 px-4 max-w-xs truncate text-[11px] text-slate-500">
                      {log.new_values ? JSON.stringify(log.new_values) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Operator Modal */}
      {showAddOperator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Register New Bus Operator</h3>
            <form onSubmit={handleCreateOperator} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Operator Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Cruiser Lines"
                  value={newOp.name}
                  onChange={(e) => setNewOp({ ...newOp, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Code (2-5 letters)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RCL"
                    value={newOp.code}
                    onChange={(e) => setNewOp({ ...newOp, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 00000"
                    value={newOp.contact_phone}
                    onChange={(e) => setNewOp({ ...newOp, contact_phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="ops@operator.com"
                  value={newOp.contact_email}
                  onChange={(e) => setNewOp({ ...newOp, contact_email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Address / HQ</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={newOp.address}
                  onChange={(e) => setNewOp({ ...newOp, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOperator(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Save Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Register Fleet Bus</h3>
            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Operator</label>
                <select
                  value={newBus.operator_id}
                  onChange={(e) => setNewBus({ ...newBus, operator_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name} ({op.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Registration No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-01-EQ-9900"
                    value={newBus.bus_number}
                    onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Volvo 9600"
                    value={newBus.model}
                    onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Coach Type</label>
                  <select
                    value={newBus.bus_type}
                    onChange={(e) => setNewBus({ ...newBus, bus_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="AC_SLEEPER">AC Sleeper 2+1</option>
                    <option value="AC_SEATER">AC Seater 2+2</option>
                    <option value="NON_AC_SEATER">Non-AC Seater</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Total Seats</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="60"
                    value={newBus.total_seats}
                    onChange={(e) => setNewBus({ ...newBus, total_seats: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Seat layout grid (decks, rows, numbers, ladies quota) will be generated automatically.
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBus(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold"
                >
                  Register Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Schedule New Trip</h3>
            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Bus</label>
                <select
                  value={newTrip.bus_id}
                  onChange={(e) => setNewTrip({ ...newTrip, bus_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number} - {b.model} ({b.operator_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Route</label>
                <select
                  value={newTrip.route_id}
                  onChange={(e) => setNewTrip({ ...newTrip, route_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.source_city} → {r.destination_city} ({r.distance_km} km)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Departure Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTrip.departure_time}
                  onChange={(e) => setNewTrip({ ...newTrip, departure_time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Arrival Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTrip.arrival_time}
                  onChange={(e) => setNewTrip({ ...newTrip, arrival_time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Base Seat Fare (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={newTrip.base_fare}
                  onChange={(e) => setNewTrip({ ...newTrip, base_fare: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrip(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

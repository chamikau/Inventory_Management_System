<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{

    public function index(Request $request)
    {
        $query = AuditLog::with('user');
        
        if ($request->has('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        if ($request->has('entity_type')) {
            $query->where('entity_type', 'like', "%{$request->entity_type}%");
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        
        if ($request->has('today')) {
            $query->whereDate('created_at', today());
        }
        
        $logs = $query->latest()->paginate($request->get('per_page', 30));
        
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function show($id)
    {
        $log = AuditLog::with('user')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $log
        ]);
    }

    public function forEntity($entityType, $entityId)
    {
        $logs = AuditLog::where('entity_type', 'like', "%{$entityType}%")
            ->where('entity_id', $entityId)
            ->with('user')
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function byAction($action)
    {
        $logs = AuditLog::where('action', $action)
            ->with('user')
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function byUser($userId)
    {
        $logs = AuditLog::where('user_id', $userId)
            ->with('user')
            ->latest()
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function statistics()
    {
        $stats = [
            'total_logs' => AuditLog::count(),
            'today_logs' => AuditLog::whereDate('created_at', today())->count(),
            'this_week_logs' => AuditLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'this_month_logs' => AuditLog::whereMonth('created_at', now()->month)->count(),
            'top_actions' => AuditLog::selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),
            'top_users' => AuditLog::selectRaw('user_id, COUNT(*) as count')
                ->with('user')
                ->groupBy('user_id')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),
            'logs_by_date' => AuditLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->limit(30)
                ->get()
        ];
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    public function export(Request $request)
    {
        $query = AuditLog::with('user');
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        
        $logs = $query->latest()->limit(5000)->get();
        
        $filename = 'audit-logs-' . date('Y-m-d-His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ];
        
        $callback = function() use ($logs) {
            $file = fopen('php://output', 'w');
            
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent', 'Old Value', 'New Value', 'Created At']);
            
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user->name ?? 'System',
                    $log->action,
                    $log->entity_type,
                    $log->entity_id,
                    $log->ip_address,
                    $log->user_agent,
                    json_encode($log->old_value),
                    json_encode($log->new_value),
                    $log->created_at
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    public function clearOld(Request $request)
    {
        $request->validate([
            'days' => 'required|integer|min:1|max:365'
        ]);
        
        $deleted = AuditLog::where('created_at', '<', now()->subDays($request->days))->delete();
        
        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} logs older than {$request->days} days"
        ]);
    }
}
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
            $query->where('entity_type', $request->entity_type);
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        
        $logs = $query->latest()->paginate($request->get('per_page', 30));
        return response()->json($logs);
    }

    public function show($id)
    {
        $log = AuditLog::with('user')->findOrFail($id);
        return response()->json($log);
    }

    public function forEntity($entityType, $entityId)
    {
        $logs = AuditLog::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->with('user')
            ->latest()
            ->paginate(20);
            
        return response()->json($logs);
    }

    public function byAction($action)
    {
        $logs = AuditLog::where('action', $action)->with('user')->latest()->paginate(20);
        return response()->json($logs);
    }

    public function byUser($userId)
    {
        $logs = AuditLog::where('user_id', $userId)->with('user')->latest()->paginate(20);
        return response()->json($logs);
    }

    public function export(Request $request)
    {
        $logs = AuditLog::with('user')->latest()->limit(1000)->get();
        
        $csv = "ID,User,Action,Entity Type,Entity ID,Old Value,New Value,IP Address,Created At\n";
        foreach ($logs as $log) {
            $csv .= "\"{$log->id}\",\"{$log->user->name}\",\"{$log->action}\",\"{$log->entity_type}\",\"{$log->entity_id}\",";
            $csv .= "\"" . json_encode($log->old_value) . "\",\"" . json_encode($log->new_value) . "\",";
            $csv .= "\"{$log->ip_address}\",\"{$log->created_at}\"\n";
        }
        
        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="audit-logs-' . date('Y-m-d') . '.csv"');
    }
}
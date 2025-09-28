<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Models\DashboardVisitModel;
use CodeIgniter\API\ResponseTrait;

class DashboardController extends BaseController
{
    use ResponseTrait;

    public function getStats()
    {
        $userModel = new UserModel();
        $visitModel = new DashboardVisitModel();

        // Record the visit (ignore failures to avoid 500)
        $userId = $this->getUserIdFromToken();
        try {
            $visitModel->insert(['user_id' => $userId, 'visited_at' => date('Y-m-d H:i:s')]);
        } catch (\Throwable $e) {
            log_message('error', 'Failed to record dashboard visit: ' . $e->getMessage());
        }

        // Aggregate stats (DB-agnostic using date ranges for SQLite/MySQL/Postgres)
        $totalUsers = $userModel->countAllResults();
        $totalVisits = (new DashboardVisitModel())->countAllResults();

        // Today range
        $todayStart = date('Y-m-d 00:00:00');
        $todayEnd   = date('Y-m-d 23:59:59');

        // Week range (Mon-Sun)
        $mondayStart = (new \DateTime('monday this week'))->format('Y-m-d 00:00:00');
        $sundayEnd   = (new \DateTime('sunday this week'))->format('Y-m-d 23:59:59');

        // Month range
        $monthStart = date('Y-m-01 00:00:00');
        $monthEnd   = date('Y-m-t 23:59:59');

        // Year range
        $yearStart  = date('Y-01-01 00:00:00');
        $yearEnd    = date('Y-12-31 23:59:59');

        // Counts using BETWEEN ranges (portable across DB drivers)
        $visitsToday = (new DashboardVisitModel())
            ->where('visited_at >=', $todayStart)
            ->where('visited_at <=', $todayEnd)
            ->countAllResults();

        $visitsThisWeek = (new DashboardVisitModel())
            ->where('visited_at >=', $mondayStart)
            ->where('visited_at <=', $sundayEnd)
            ->countAllResults();

        $visitsThisMonth = (new DashboardVisitModel())
            ->where('visited_at >=', $monthStart)
            ->where('visited_at <=', $monthEnd)
            ->countAllResults();

        $visitsThisYear = (new DashboardVisitModel())
            ->where('visited_at >=', $yearStart)
            ->where('visited_at <=', $yearEnd)
            ->countAllResults();

        $stats = [
            'total_users' => $totalUsers,
            'total_dashboard_access' => $totalVisits,
            'pie_chart_data' => [
                'today' => $visitsToday,
                'this_week' => $visitsThisWeek,
                'this_month' => $visitsThisMonth,
                'this_year' => $visitsThisYear,
            ]
        ];

        return $this->respond($stats);
    }

    private function getUserIdFromToken()
    {
        // This is duplicated from UserController, in a real app, move this to a BaseController or a helper
        $header = $this->request->getHeaderLine("Authorization");
        $token = explode(" ", $header)[1];
        $key = getenv('jwt.secret');
        $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
        return $decoded->uid;
    }
}

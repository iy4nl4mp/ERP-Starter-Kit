<?php

namespace App\Models;

use CodeIgniter\Model;

class DashboardVisitModel extends Model
{
    protected $table            = 'dashboard_visits';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['user_id', 'visited_at'];
}

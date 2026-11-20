<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Hanya user terautentikasi (Sanctum) yang boleh subscribe monitoring mesin
Broadcast::channel('machines', fn (User $user) => true);

<?php

namespace App\Events;

use App\Http\Resources\MachineResource;
use App\Models\Machine;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MachineUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public Machine $machine, public bool $deleted = false)
    {
        $this->machine->loadMissing('currentOperator:id,name,employee_code');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('machines')];
    }

    public function broadcastAs(): string
    {
        return 'machine.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'machine' => (new MachineResource($this->machine))->resolve(),
            'deleted' => $this->deleted,
        ];
    }
}

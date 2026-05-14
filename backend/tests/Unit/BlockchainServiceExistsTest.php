<?php

namespace Tests\Unit;

use App\Services\BlockchainService;
use PHPUnit\Framework\TestCase;

/**
 * BlockchainService requires env SIMPLE_VOTING_ADDRESS and JSON ABI at runtime.
 * Smoke test: class is loadable (constructor not invoked).
 */
class BlockchainServiceExistsTest extends TestCase
{
    public function test_class_exists(): void
    {
        $this->assertTrue(class_exists(BlockchainService::class));
    }
}

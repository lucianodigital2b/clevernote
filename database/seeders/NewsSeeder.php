<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\News;
use Carbon\Carbon;

class NewsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        News::create([
            'title' => 'Welcome to CleverNote!',
            'content' => 'We are excited to announce the launch of our new features! CleverNote now includes enhanced AI-powered study tools, improved flashcard generation, and a brand new focus mode to help you study more effectively.',
            'featured_image' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            'priority' => 100, // High priority
            'published_at' => Carbon::now(),
        ]);

        News::create([
            'title' => 'New Study Templates Available',
            'content' => 'Check out our new collection of study templates designed to help you organize your notes better. From Cornell notes to mind maps, we have got you covered!',
            'featured_image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            'priority' => 50, // Medium priority
            'published_at' => Carbon::now()->subDays(2),
        ]);

        News::create([
            'title' => 'Maintenance Scheduled',
            'content' => 'We will be performing scheduled maintenance on Sunday from 2:00 AM to 4:00 AM UTC. During this time, some features may be temporarily unavailable.',
            'priority' => 10, // Low priority
            'published_at' => Carbon::now()->subDays(5),
        ]);

        News::create([
            'title' => 'Mobile App Coming Soon',
            'content' => 'We are working hard on bringing CleverNote to your mobile devices. Stay tuned for updates on our iOS and Android apps!',
            'featured_image' => 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            'priority' => 50, // Medium priority
            'published_at' => Carbon::now()->subWeek(),
        ]);
    }
}
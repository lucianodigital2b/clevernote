# Focus Module (Pomodoro Timer) - Setup and Usage Guide

## Overview

The Focus module is a comprehensive Pomodoro timer implementation that helps users manage their focus sessions with tag-based organization and detailed analytics. It includes session management, leaderboards, and historical tracking.

## Features

### Core Functionality
- **Pomodoro Timer**: Customizable focus sessions (15, 25, 45, or 60 minutes)
- **Session Management**: Start, pause, resume, complete, or cancel sessions
- **Tag Association**: Associate focus sessions with specific tags for organization
- **Real-time Updates**: Live timer with remaining time display
- **Session Notes**: Add optional notes to completed sessions

### Analytics & Tracking
- **Daily Statistics**: Track sessions completed and total focus time per day
- **Leaderboards**: Compare performance with other users across different time periods
- **Session History**: View detailed history of all focus sessions with pagination
- **User Statistics Integration**: Focus data is integrated with existing user statistics

### User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Full dark mode compatibility
- **Tabbed Interface**: Easy navigation between timer, leaderboard, and history
- **Real-time Status**: Visual indicators for session status (active, paused, completed, cancelled)

## Database Schema

### Focus Sessions Table
```sql
CREATE TABLE focus_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    planned_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NULL,
    status ENUM('active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    pause_intervals JSON NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE SET NULL,
    INDEX idx_user_sessions (user_id, created_at),
    INDEX idx_status (status),
    INDEX idx_tag_sessions (tag_id)
);
```

### User Statistics Updates
The existing `user_statistics` table has been extended with:
- `focus_sessions_completed`: Number of completed focus sessions
- `focus_time_minutes`: Total focus time in minutes

## Backend Implementation

### Models

#### FocusSession Model
- **Location**: `app/Models/FocusSession.php`
- **Relationships**: Belongs to User and Tag
- **Key Methods**:
  - `getActiveSession()`: Get user's current active session
  - `startSession()`: Start a new focus session
  - `pause()`: Pause the current session
  - `resume()`: Resume a paused session
  - `complete()`: Complete the session
  - `cancel()`: Cancel the session
  - `calculateActualDuration()`: Calculate actual session duration
  - `getRemainingMinutes()`: Get remaining time in session

#### Updated Models
- **User Model**: Added `focusSessions()` and `tags()` relationships
- **Tag Model**: Added `focusSessions()` relationship and proper fillable attributes
- **UserStatistics Model**: Added focus-related fields

### Controller

#### FocusController
- **Location**: `app/Http/Controllers/FocusController.php`
- **Routes**: All routes are prefixed with `/focus`
- **Key Methods**:
  - `index()`: Display the focus timer page
  - `start()`: Start a new focus session
  - `pause()`: Pause current session
  - `resume()`: Resume paused session
  - `complete()`: Complete current session
  - `cancel()`: Cancel current session
  - `status()`: Get current session status
  - `leaderboard()`: Get leaderboard data for different periods
  - `history()`: Get paginated session history

### Routes
```php
// Focus Module Routes
Route::prefix('focus')->name('focus.')->group(function () {
    Route::get('/', [FocusController::class, 'index'])->name('index');
    Route::post('/start', [FocusController::class, 'start'])->name('start');
    Route::post('/pause', [FocusController::class, 'pause'])->name('pause');
    Route::post('/resume', [FocusController::class, 'resume'])->name('resume');
    Route::post('/complete', [FocusController::class, 'complete'])->name('complete');
    Route::post('/cancel', [FocusController::class, 'cancel'])->name('cancel');
    Route::get('/status', [FocusController::class, 'status'])->name('status');
    Route::get('/leaderboard', [FocusController::class, 'leaderboard'])->name('leaderboard');
    Route::get('/history', [FocusController::class, 'history'])->name('history');
});
```

## Frontend Implementation

### Main Components

#### Focus Index Page
- **Location**: `resources/js/pages/Focus/Index.tsx`
- **Features**:
  - Timer interface with duration selection
  - Tag selection for sessions
  - Real-time countdown display
  - Session control buttons (start, pause, resume, complete, cancel)
  - Daily statistics display
  - Tabbed interface for leaderboard and history

#### Focus Components

1. **FocusStats** (`resources/js/components/Focus/FocusStats.tsx`)
   - Displays today's focus statistics
   - Shows sessions completed and total focus time
   - Responsive card layout with icons

2. **FocusLeaderboard** (`resources/js/components/Focus/FocusLeaderboard.tsx`)
   - Period-based leaderboards (day, week, month, year)
   - Ranking display with special styling for top 3
   - Current user highlighting
   - Session and time statistics for each user

3. **FocusHistory** (`resources/js/components/Focus/FocusHistory.tsx`)
   - Paginated session history
   - Detailed session information including duration, status, and notes
   - Status badges and icons
   - Pause time calculations

### Navigation Integration

The Focus module has been integrated into the main navigation:
- **Sidebar**: Added to `app-sidebar.tsx` with Timer icon
- **Header**: Added to `app-header.tsx` for desktop navigation
- **Icon**: Uses Lucide React's `Timer` icon

### Blade Template
- **Location**: `resources/views/focus/index.blade.php`
- **Purpose**: Renders the React application container
- **Vite Integration**: Includes the Focus Index TypeScript file

## API Endpoints

### Session Management
- `POST /focus/start` - Start a new focus session
- `POST /focus/pause` - Pause current session
- `POST /focus/resume` - Resume paused session
- `POST /focus/complete` - Complete current session
- `POST /focus/cancel` - Cancel current session
- `GET /focus/status` - Get current session status

### Data Retrieval
- `GET /focus` - Focus timer page
- `GET /focus/leaderboard?period={day|week|month|year}` - Get leaderboard data
- `GET /focus/history?page={number}` - Get paginated session history

## Usage Instructions

### Starting a Focus Session
1. Navigate to the Focus page via the sidebar or header navigation
2. Select desired session duration (15, 25, 45, or 60 minutes)
3. Optionally select a tag to associate with the session
4. Click "Start Focus Session" button
5. The timer will begin counting down

### Managing Active Sessions
- **Pause**: Click the pause button to temporarily stop the timer
- **Resume**: Click the resume button to continue a paused session
- **Complete**: Click the complete button to finish the session early
- **Cancel**: Click the cancel button to abandon the session

### Adding Session Notes
- When completing a session, you can add optional notes
- Notes are saved with the session and visible in the history

### Viewing Analytics
- **Today's Stats**: Displayed at the top of the Focus page
- **Leaderboard**: Switch to the Leaderboard tab to see rankings
- **History**: Switch to the History tab to view past sessions

## Technical Notes

### State Management
- Uses React hooks for local state management
- Real-time timer updates using `setInterval`
- Automatic cleanup of intervals on component unmount

### Error Handling
- Toast notifications for user feedback
- Graceful handling of API errors
- Loading states for better user experience

### Performance Considerations
- Efficient timer implementation with proper cleanup
- Pagination for session history to handle large datasets
- Optimized database queries with proper indexing

### Security
- All routes are protected by authentication middleware
- User can only access their own sessions
- Proper validation of session data

## Future Enhancements

Potential improvements for the Focus module:

1. **Notifications**: Browser notifications when sessions complete
2. **Sound Alerts**: Audio notifications for session events
3. **Custom Durations**: Allow users to set custom session lengths
4. **Break Timers**: Implement break periods between focus sessions
5. **Goals**: Set daily/weekly focus time goals
6. **Streaks**: Track consecutive days of focus sessions
7. **Export**: Export session data to CSV or other formats
8. **Team Features**: Team-based leaderboards and challenges

## Troubleshooting

### Common Issues

1. **Timer not starting**: Check browser console for JavaScript errors
2. **Sessions not saving**: Verify database connection and migrations
3. **Leaderboard not loading**: Check API endpoint responses
4. **Navigation not showing**: Ensure proper icon imports

### Database Issues
- Run `php artisan migrate` to ensure all tables are created
- Check foreign key constraints if experiencing data issues
- Verify user permissions for database operations

### Frontend Issues
- Clear browser cache if components not loading
- Check network tab for failed API requests
- Verify all component imports are correct

This comprehensive Focus module provides a solid foundation for productivity tracking and can be extended with additional features as needed.
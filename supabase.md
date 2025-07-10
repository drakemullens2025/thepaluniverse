# Supabase Integration Documentation

## Overview

This document provides a comprehensive overview of Supabase integrations in the Pal Universe app, including table structures, file locations, and data flow patterns.

## Database Schema

### Tables Overview

The application uses 6 main tables:

1. **profiles** - User profile information
2. **study_sessions** - Study tracking (planned feature)
3. **notes** - Note processing and storage
4. **homework_queries** - Homework help requests
5. **cringe_ratings** - Cringe analysis results
6. **roasts** - Roast generation results

## Table Structures

### 1. profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

**Used in files:**
- `lib/auth.ts` - Profile CRUD operations
- `contexts/AuthContext.tsx` - Profile state management
- `components/AuthHeader.tsx` - Display user initials

### 2. study_sessions
```sql
CREATE TABLE study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  duration_minutes integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own study sessions"
  ON study_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

**Status:** Planned feature for Study Pal
**Will be used in:** `app/(tabs)/study.tsx` (currently shows coming soon)

### 3. notes
```sql
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  original_text text,
  processed_text text,
  processing_type text CHECK (processing_type IN ('textify', 'summarize', 'depth')),
  image_url text,
  key_points text[],
  action_items text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON notes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
```

**Used in files:**
- `app/(tabs)/notes.tsx` - Note processing interface
- `lib/gemini.ts` - `processNote()` function
- `lib/sharing.ts` - Note sharing functionality (planned)

### 4. homework_queries
```sql
CREATE TABLE homework_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  iq_level integer NOT NULL CHECK (iq_level >= 100 AND iq_level <= 160),
  solution text NOT NULL,
  step_by_step text[],
  key_points text[],
  writing_style text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE homework_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own homework queries"
  ON homework_queries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_homework_user_id ON homework_queries(user_id);
CREATE INDEX idx_homework_iq_level ON homework_queries(iq_level);
CREATE INDEX idx_homework_created_at ON homework_queries(created_at DESC);
```

**Used in files:**
- `app/(tabs)/homework.tsx` - Homework help interface
- `components/IQSlider.tsx` - IQ level selection
- `lib/gemini.ts` - `generateHomeworkHelp()` function

### 5. cringe_ratings
```sql
CREATE TABLE cringe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_text text,
  item_url text,
  hot_score integer CHECK (hot_score >= 0 AND hot_score <= 100),
  cringe_score integer CHECK (cringe_score >= 0 AND cringe_score <= 100),
  analysis text,
  tips text[],
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE cringe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cringe ratings"
  ON cringe_ratings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_cringe_user_id ON cringe_ratings(user_id);
CREATE INDEX idx_cringe_scores ON cringe_ratings(hot_score, cringe_score);
CREATE INDEX idx_cringe_created_at ON cringe_ratings(created_at DESC);
```

**Used in files:**
- `app/(tabs)/cringe.tsx` - Cringe analysis interface
- `lib/gemini.ts` - `analyzeCringe()` function
- `lib/sharing.ts` - Save/retrieve cringe analyses
- `components/CreationsGallery.tsx` - Display saved analyses
- `components/PhotoMarkupModal.tsx` - Edit and share analyses

### 6. roasts
```sql
CREATE TABLE roasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_text text,
  item_url text,
  intensity integer CHECK (intensity >= 1 AND intensity <= 5),
  roast_text text NOT NULL,
  burn_level integer CHECK (burn_level >= 0 AND burn_level <= 100),
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE roasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own roasts"
  ON roasts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_roasts_user_id ON roasts(user_id);
CREATE INDEX idx_roasts_intensity ON roasts(intensity);
CREATE INDEX idx_roasts_burn_level ON roasts(burn_level);
CREATE INDEX idx_roasts_created_at ON roasts(created_at DESC);
```

**Used in files:**
- `app/(tabs)/roast.tsx` - Roast generation interface
- `components/IntensitySlider.tsx` - Intensity level selection
- `lib/gemini.ts` - `generateRoast()` function
- `lib/sharing.ts` - Save/retrieve roasts
- `components/CreationsGallery.tsx` - Display saved roasts
- `components/PhotoMarkupModal.tsx` - Edit and share roasts

## File Integration Details

### Authentication Files

**`lib/auth.ts`**
- Tables used: `profiles`
- Functions: `signUp()`, `signIn()`, `signOut()`, `getUserProfile()`, `updateProfile()`
- Creates profile entry on user registration
- Manages user authentication state

**`contexts/AuthContext.tsx`**
- Tables used: `profiles`
- Provides authentication context throughout app
- Manages user and profile state
- Handles auth state changes

### Core Feature Files

**`app/(tabs)/cringe.tsx`**
- Tables used: `cringe_ratings` (via sharing service)
- Integrates with Gemini AI for analysis
- Saves results to database when user is logged in
- Falls back to local storage for anonymous users

**`app/(tabs)/roast.tsx`**
- Tables used: `roasts` (via sharing service)
- Integrates with Gemini AI for roast generation
- Saves results to database when user is logged in
- Falls back to local storage for anonymous users

**`app/(tabs)/homework.tsx`**
- Tables used: `homework_queries` (planned integration)
- Currently uses Gemini AI without database storage
- Future: Will save queries and responses for user history

**`app/(tabs)/notes.tsx`**
- Tables used: `notes` (planned integration)
- Currently processes notes without database storage
- Future: Will save processed notes for user access

### Sharing and Gallery

**`lib/sharing.ts`**
- Tables used: `roasts`, `cringe_ratings`
- Functions: `saveCreationToDatabase()`, `getUserCreations()`, `deleteCreation()`
- Handles both database and local storage operations
- Manages creation sharing and retrieval

**`components/CreationsGallery.tsx`**
- Tables used: `roasts`, `cringe_ratings` (via sharing service)
- Displays user's saved creations
- Handles deletion of creations
- Supports both logged-in and anonymous users

**`components/PhotoMarkupModal.tsx`**
- Tables used: `roasts`, `cringe_ratings` (via sharing service)
- Allows editing and sharing of creations
- Saves edited versions back to database/storage

## Data Flow Patterns

### User Registration Flow
1. User signs up via `AuthModal` → `AuthContext` → `lib/auth.ts`
2. `signUp()` creates auth user and profile entry
3. Profile data flows to `AuthHeader` for display

### Content Creation Flow
1. User creates content (roast/cringe) in respective tab
2. AI processes content via `lib/gemini.ts`
3. Result saved via `lib/sharing.ts` to database (if logged in) or local storage
4. Content appears in gallery via `CreationsGallery`

### Content Editing Flow
1. User selects creation from gallery
2. `PhotoMarkupModal` opens with editing tools
3. Edited version saved back via sharing service
4. Gallery refreshes with updated content

## Local Storage Fallback

For anonymous users, the app uses AsyncStorage:

**Storage Key:** `saved_creations`
**Structure:**
```typescript
interface SharedCreation {
  id: string;
  userId: string; // 'anonymous' for local storage
  type: 'roast' | 'cringe';
  imageUri: string;
  aiResponse: string;
  metadata: any;
  createdAt: string;
  shareCount: number;
  likeCount: number;
}
```

**Files handling local storage:**
- `lib/sharing.ts` - All local storage operations
- `components/CreationsGallery.tsx` - Displays local creations

## Error Handling

### Database Errors
- Connection failures fall back to local storage
- RLS policy violations show appropriate error messages
- Quota exceeded errors prompt user to log in

### Storage Quota Errors
- Local storage quota exceeded shows specific error
- Prompts user to log in for cloud storage
- Graceful degradation of functionality

**Error handling locations:**
- `lib/sharing.ts` - Storage error handling
- `app/(tabs)/cringe.tsx` - Creation saving errors
- `app/(tabs)/roast.tsx` - Creation saving errors

## Performance Optimizations

### Database Indexes
- User-based queries: `idx_*_user_id` on all user tables
- Time-based queries: `idx_*_created_at` for chronological sorting
- Feature-specific: `idx_homework_iq_level`, `idx_roasts_intensity`

### Caching Strategy
- User profiles cached in AuthContext
- Local storage used as cache for anonymous users
- Gallery data refreshed on focus/pull-to-refresh

### Query Optimization
- RLS policies ensure users only access their own data
- Pagination planned for large datasets
- Selective field loading where appropriate

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies use `auth.uid()` for user identification

### Data Validation
- Check constraints on score ranges (0-100)
- Intensity levels constrained (1-5)
- IQ levels constrained (100-160)

### API Security
- Gemini API key stored in environment variables
- Supabase keys use appropriate access levels
- No sensitive data in client-side code

## Environment Variables

Required environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

**Configuration files:**
- `lib/supabase.ts` - Supabase client configuration
- `lib/gemini.ts` - Gemini API configuration
- `types/env.d.ts` - Environment variable types

## Migration History

### Current Migration: `20250709232247_damp_crystal.sql`
- Fixes profiles table RLS policies
- Updates INSERT policy to use correct `auth.uid()` function
- Ensures consistency across all profile policies

### Future Migrations Needed
- Add missing tables: `study_sessions`, `notes`, `homework_queries`
- Add indexes for performance optimization
- Add any additional RLS policies as features are implemented

## Future Enhancements

### Planned Database Features
1. **Study Sessions Tracking** - Full implementation of study_sessions table
2. **Note History** - Save and retrieve processed notes
3. **Homework History** - Track homework queries and solutions
4. **Social Features** - Sharing creations publicly (new tables needed)
5. **Analytics** - Usage tracking and insights
6. **Favorites** - User favorites system for creations

### Performance Improvements
1. **Pagination** - Implement for large datasets
2. **Caching** - Redis layer for frequently accessed data
3. **CDN Integration** - For image storage and delivery
4. **Real-time Updates** - Supabase real-time subscriptions

### Security Enhancements
1. **Rate Limiting** - Prevent API abuse
2. **Content Moderation** - Automated content filtering
3. **Audit Logging** - Track user actions
4. **Data Encryption** - Additional encryption for sensitive data

## Troubleshooting

### Common Issues

**RLS Policy Errors:**
- Ensure user is authenticated before database operations
- Check that policies use `auth.uid()` not `uid()`
- Verify user has permission for the operation

**Connection Issues:**
- Check environment variables are set correctly
- Verify Supabase project is active
- Ensure network connectivity

**Storage Quota Issues:**
- Clear local storage if quota exceeded
- Prompt user to log in for cloud storage
- Implement data cleanup strategies

### Debug Commands

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check user permissions
SELECT auth.uid();

-- View table structure
\d+ profiles
```

### Monitoring

- Monitor Supabase dashboard for usage and errors
- Track API response times and error rates
- Monitor local storage usage on client devices
- Set up alerts for critical failures

---

This documentation should be updated as new features are implemented and database schema evolves.
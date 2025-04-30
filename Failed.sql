create table public.post_comments (
  id uuid not null default extensions.uuid_generate_v4 (),
  post_id uuid null,
  user_id uuid null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_comments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists post_comments_post_id_idx on public.post_comments using btree (post_id) TABLESPACE pg_default;

create index IF not exists post_comments_user_id_idx on public.post_comments using btree (user_id) TABLESPACE pg_default;


post_likes table

create table public.post_likes (
  id uuid not null default gen_random_uuid (),
  post_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint post_likes_pkey primary key (id),
  constraint post_likes_post_id_user_id_key unique (post_id, user_id),
  constraint post_likes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_likes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_likes_post_id on public.post_likes using btree (post_id) TABLESPACE pg_default;

create index IF not exists idx_post_likes_user_id on public.post_likes using btree (user_id) TABLESPACE pg_default;




postts table

create table public.posts (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  content text null,
  image_url text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  caption text null,
  type text null default 'text'::text,
  media_url text null,
  cloudinary_public_id text null,
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint posts_type_check check (
    (
      type = any (array['text'::text, 'image'::text, 'video'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_posts_type on public.posts using btree (type) TABLESPACE pg_default;

create index IF not exists idx_posts_user_id on public.posts using btree (user_id) TABLESPACE pg_default;

create index IF not exists posts_created_at_idx on public.posts using btree (created_at) TABLESPACE pg_default;

create index IF not exists posts_user_id_idx on public.posts using btree (user_id) TABLESPACE pg_default;




profile_visit table

create table public.profile_visits (
  id uuid not null default gen_random_uuid (),
  profile_id uuid not null,
  visitor_id uuid not null,
  visited_at timestamp with time zone not null default timezone ('utc'::text, now()),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  visit_month date GENERATED ALWAYS as (
    (
      ((visited_at AT TIME ZONE 'UTC'::text))::date - (
        (
          EXTRACT(
            day
            from
              (visited_at AT TIME ZONE 'UTC'::text)
          )
        )::integer - 1
      )
    )
  ) STORED null,
  constraint profile_visits_pkey primary key (id),
  constraint profile_visits_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint profile_visits_visitor_id_fkey foreign KEY (visitor_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists profile_visits_profile_id_idx on public.profile_visits using btree (profile_id) TABLESPACE pg_default;

create index IF not exists profile_visits_visitor_id_idx on public.profile_visits using btree (visitor_id) TABLESPACE pg_default;

create index IF not exists profile_visits_visited_at_idx on public.profile_visits using btree (visited_at) TABLESPACE pg_default;

create index IF not exists idx_profile_visits_cleanup on public.profile_visits using btree (visited_at) TABLESPACE pg_default;

create trigger daily_profile_visits_cleanup
after INSERT on profile_visits for EACH STATEMENT when (
  EXTRACT(
    hour
    from
      CURRENT_TIMESTAMP
  ) = 0::numeric
)
execute FUNCTION trigger_cleanup_profile_visits ();




profiles table

create table public.profiles (
  id uuid not null,
  username text null,
  full_name text null,
  avatar_url text null,
  bio text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  rank serial not null,
  cover_url text null,
  gender text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists profiles_username_idx on public.profiles using btree (username) TABLESPACE pg_default;

create index IF not exists profiles_rank_idx on public.profiles using btree (rank) TABLESPACE pg_default;

create trigger assign_rank_on_insert BEFORE INSERT on profiles for EACH row
execute FUNCTION assign_user_rank ();




story_views table

create table public.story_views (
  id uuid not null default gen_random_uuid (),
  story_id uuid null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint story_views_pkey primary key (id),
  constraint story_views_story_id_user_id_key unique (story_id, user_id),
  constraint story_views_story_id_fkey foreign KEY (story_id) references stories (id) on delete CASCADE,
  constraint story_views_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_story_views_story_id on public.story_views using btree (story_id) TABLESPACE pg_default;

create index IF not exists idx_story_views_user_id on public.story_views using btree (user_id) TABLESPACE pg_default;


stories table

create table public.stories (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  media_url text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  expires_at timestamp with time zone null default (
    timezone ('utc'::text, now()) + '24:00:00'::interval
  ),
  type text not null,
  cloudinary_public_id text not null,
  followers_only boolean not null default true,
  story_group_id uuid not null default gen_random_uuid (),
  is_first_story boolean not null default true,
  constraint stories_pkey primary key (id),
  constraint stories_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint stories_type_check check (
    (type = any (array['image'::text, 'video'::text]))
  )
) TABLESPACE pg_default;

create index IF not exists idx_stories_group on public.stories using btree (story_group_id) TABLESPACE pg_default;

create index IF not exists stories_created_at_idx on public.stories using btree (created_at) TABLESPACE pg_default;

create index IF not exists stories_user_id_idx on public.stories using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_stories_story_group_id on public.stories using btree (story_group_id) TABLESPACE pg_default;

create trigger trigger_delete_expired_stories
after INSERT
or
update on stories for EACH STATEMENT
execute FUNCTION delete_expired_stories ();


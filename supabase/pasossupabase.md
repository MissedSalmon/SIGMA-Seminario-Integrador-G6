1. Install packages
Run this command to install the required dependencies.
Code:
File: Code
```
npm install @supabase/supabase-js @supabase/ssr
```

2. Add files
Add env variables, create Supabase client helpers, and set up middleware to keep sessions refreshed.
Code:
File: .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://agayydinmimmqoyuybbi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_c6nD29vnLO9OiMWat9M3uQ_GfZK0L7I
```

File: page.tsx
```
1import { createClient } from '@/utils/supabase/server'
2import { cookies } from 'next/headers'
3
4export default async function Page() {
5  const cookieStore = await cookies()
6  const supabase = createClient(cookieStore)
7
8  const { data: todos } = await supabase.from('todos').select()
9
10  return (
11    <ul>
12      {todos?.map((todo) => (
13        <li key={todo.id}>{todo.name}</li>
14      ))}
15    </ul>
16  )
17}
```

File: utils/supabase/server.ts
```
1import { createServerClient } from "@supabase/ssr";
2import { cookies } from "next/headers";
3
4const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
5const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
6
7export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
8  return createServerClient(
9    supabaseUrl!,
10    supabaseKey!,
11    {
12      cookies: {
13        getAll() {
14          return cookieStore.getAll()
15        },
16        setAll(cookiesToSet) {
17          try {
18            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
19          } catch {
20            // The `setAll` method was called from a Server Component.
21            // This can be ignored if you have middleware refreshing
22            // user sessions.
23          }
24        },
25      },
26    },
27  );
28};
```

File: utils/supabase/client.ts
```
1import { createBrowserClient } from "@supabase/ssr";
2
3const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
4const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
5
6export const createClient = () =>
7  createBrowserClient(
8    supabaseUrl!,
9    supabaseKey!,
10  );
```

File: utils/supabase/middleware.ts
```
1import { createServerClient } from "@supabase/ssr";
2import { type NextRequest, NextResponse } from "next/server";
3
4const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
5const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
6
7export const createClient = (request: NextRequest) => {
8  // Create an unmodified response
9  let supabaseResponse = NextResponse.next({
10    request: {
11      headers: request.headers,
12    },
13  });
14
15  const supabase = createServerClient(
16    supabaseUrl!,
17    supabaseKey!,
18    {
19      cookies: {
20        getAll() {
21          return request.cookies.getAll()
22        },
23        setAll(cookiesToSet) {
24          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
25          supabaseResponse = NextResponse.next({
26            request,
27          })
28          cookiesToSet.forEach(({ name, value, options }) =>
29            supabaseResponse.cookies.set(name, value, options)
30          )
31        },
32      },
33    },
34  );
35
36  return supabaseResponse
37};
```

3. Install Agent Skills (optional)
Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.
Code:
File: Code
```
npx skills add supabase/agent-skills
```
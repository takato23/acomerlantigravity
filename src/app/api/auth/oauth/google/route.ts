import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://acomerlantigravity.vercel.app'}/auth/callback`,
        },
    });

    if (error) {
        console.error('OAuth error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data?.url) {
        return NextResponse.redirect(data.url);
    }

    return NextResponse.json({ error: 'No OAuth URL returned' }, { status: 500 });
}

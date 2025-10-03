export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: 'child' | 'parent' | 'guest';
          allowlisted: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          role?: 'child' | 'parent' | 'guest';
          allowlisted?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          role?: 'child' | 'parent' | 'guest';
          allowlisted?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author: string | null;
          title: string;
          content: string;
          content_html: string | null;
          content_json: Json | null;
          image_url: string | null;
          visibility: 'family' | 'public';
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          created_at: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          author?: string | null;
          title: string;
          content: string;
          content_html?: string | null;
          content_json?: Json | null;
          image_url?: string | null;
          visibility?: 'family' | 'public';
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_at?: string | null;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          author?: string | null;
          title?: string;
          content?: string;
          content_html?: string | null;
          content_json?: Json | null;
          image_url?: string | null;
          visibility?: 'family' | 'public';
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          created_at?: string | null;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_fkey';
            columns: ['author'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author: string | null;
          content: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author?: string | null;
          content: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          author?: string | null;
          content?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_fkey';
            columns: ['author'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      tags: {
        Row: {
          id: number;
          name: string;
          slug: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      post_tags: {
        Row: {
          id: number;
          post_id: string;
          tag_id: number;
        };
        Insert: {
          id?: number;
          post_id: string;
          tag_id: number;
        };
        Update: {
          id?: number;
          post_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'post_tags_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_tags_tag_id_fkey';
            columns: ['tag_id'];
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          }
        ];
      };
      scratch_projects: {
        Row: {
          id: string;
          user_id: string;
          scratch_id: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scratch_id: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scratch_id?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scratch_projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables = Database['public']['Tables'];
export type TablesInsert<TableName extends keyof Tables> = Tables[TableName]['Insert'];
export type TablesRow<TableName extends keyof Tables> = Tables[TableName]['Row'];
export type TablesUpdate<TableName extends keyof Tables> = Tables[TableName]['Update'];

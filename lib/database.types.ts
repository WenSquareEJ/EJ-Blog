export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericTable<Row = Record<string, unknown>, Insert = Row, Update = Row> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: {
    foreignKeyName: string;
    columns: string[];
    referencedRelation: string;
    referencedColumns: string[];
  }[];
};

export interface Database {
  public: {
    Tables: Record<string, GenericTable> & {
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
            foreignKeyName: "scratch_projects_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, GenericTable>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
}

export type Tables = Database["public"]["Tables"];

export type TablesInsert<TableName extends keyof Tables> = Tables[TableName]["Insert"];
export type TablesRow<TableName extends keyof Tables> = Tables[TableName]["Row"];
export type TablesUpdate<TableName extends keyof Tables> = Tables[TableName]["Update"];

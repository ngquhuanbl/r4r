export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      business_platforms: {
        Row: {
          business_id: number;
          created_at: string;
          id: number;
          is_verified: boolean | null;
          platform_business_id: string | null;
          platform_id: number;
          platform_url: string | null;
          updated_at: string;
        };
        Insert: {
          business_id: number;
          created_at?: string;
          id?: number;
          is_verified?: boolean | null;
          platform_business_id?: string | null;
          platform_id: number;
          platform_url?: string | null;
          updated_at?: string;
        };
        Update: {
          business_id?: number;
          created_at?: string;
          id?: number;
          is_verified?: boolean | null;
          platform_business_id?: string | null;
          platform_id?: number;
          platform_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_platforms_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_platforms_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          }
        ];
      };
      businesses: {
        Row: {
          address: string;
          business_name: string;
          city: string;
          created_at: string;
          id: number;
          phone: string | null;
          state: string;
          updated_at: string;
          user_id: string;
          zip_code: string;
        };
        Insert: {
          address: string;
          business_name: string;
          city: string;
          created_at?: string;
          id?: number;
          phone?: string | null;
          state: string;
          updated_at?: string;
          user_id: string;
          zip_code: string;
        };
        Update: {
          address?: string;
          business_name?: string;
          city?: string;
          created_at?: string;
          id?: number;
          phone?: string | null;
          state?: string;
          updated_at?: string;
          user_id?: string;
          zip_code?: string;
        };
        Relationships: [];
      };
      invitation_statuses: {
        Row: {
          description: string;
          id: number;
          name: string;
        };
        Insert: {
          description: string;
          id?: number;
          name: string;
        };
        Update: {
          description?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      platforms: {
        Row: {
          color: string;
          created_at: string;
          id: number;
          name: string;
          updated_at: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          id?: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: number;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_invitations: {
        Row: {
          business_id: number;
          created_at: string;
          id: number;
          invitee_id: string;
          inviter_id: string;
          message: string | null;
          platform_id: number;
          status_id: number;
          updated_at: string;
        };
        Insert: {
          business_id: number;
          created_at?: string;
          id?: number;
          invitee_id: string;
          inviter_id: string;
          message?: string | null;
          platform_id: number;
          status_id: number;
          updated_at?: string;
        };
        Update: {
          business_id?: number;
          created_at?: string;
          id?: number;
          invitee_id?: string;
          inviter_id?: string;
          message?: string | null;
          platform_id?: number;
          status_id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_invitations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_invitations_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "platforms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_invitations_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "invitation_statuses";
            referencedColumns: ["id"];
          }
        ];
      };
      review_statuses: {
        Row: {
          description: string;
          id: number;
          name: string;
        };
        Insert: {
          description: string;
          id?: number;
          name: string;
        };
        Update: {
          description?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          content: string | null;
          created_at: string;
          id: number;
          invitation_id: number;
          rejection_reason: string | null;
          status_id: number;
          submitted_at: string | null;
          updated_at: string;
          url: string | null;
          verified_at: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: number;
          invitation_id: number;
          rejection_reason?: string | null;
          status_id: number;
          submitted_at?: string | null;
          updated_at?: string;
          url?: string | null;
          verified_at?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: number;
          invitation_id?: number;
          rejection_reason?: string | null;
          status_id?: number;
          submitted_at?: string | null;
          updated_at?: string;
          url?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "review_invitations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "review_statuses";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

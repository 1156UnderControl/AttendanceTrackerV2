export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor: string | null;
          after: Json | null;
          at: string;
          before: Json | null;
          entity: string;
          entity_id: string | null;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: never;
        };
        Relationships: [];
      };
      correction_requests: {
        Row: {
          created_at: string;
          id: string;
          member_id: string;
          note: string | null;
          requested_check_out: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          session_id: string;
          status: Database["public"]["Enums"]["request_status"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          member_id: string;
          note?: string | null;
          requested_check_out: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          session_id: string;
          status?: Database["public"]["Enums"]["request_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          member_id?: string;
          note?: string | null;
          requested_check_out?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          session_id?: string;
          status?: Database["public"]["Enums"]["request_status"];
        };
        Relationships: [
          {
            foreignKeyName: "correction_requests_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "correction_requests_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          category: Database["public"]["Enums"]["category"] | null;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          label: string;
          max_uses: number;
          revoked_at: string | null;
          token_hash: string;
          type: Database["public"]["Enums"]["member_type"];
          uses: number;
        };
        ComputedFields: never;
        Insert: {
          category?: Database["public"]["Enums"]["category"] | null;
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          label?: string;
          max_uses?: number;
          revoked_at?: string | null;
          token_hash: string;
          type: Database["public"]["Enums"]["member_type"];
          uses?: number;
        };
        Update: {
          category?: Database["public"]["Enums"]["category"] | null;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          label?: string;
          max_uses?: number;
          revoked_at?: string | null;
          token_hash?: string;
          type?: Database["public"]["Enums"]["member_type"];
          uses?: number;
        };
        Relationships: [];
      };
      members: {
        Row: {
          active: boolean;
          category: Database["public"]["Enums"]["category"];
          code: string;
          created_at: string;
          id: string;
          invite_id: string | null;
          locale: string;
          name: string;
          type: Database["public"]["Enums"]["member_type"];
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          category: Database["public"]["Enums"]["category"];
          code: string;
          created_at?: string;
          id?: string;
          invite_id?: string | null;
          locale?: string;
          name: string;
          type: Database["public"]["Enums"]["member_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean;
          category?: Database["public"]["Enums"]["category"];
          code?: string;
          created_at?: string;
          id?: string;
          invite_id?: string | null;
          locale?: string;
          name?: string;
          type?: Database["public"]["Enums"]["member_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_invite_id_fkey";
            columns: ["invite_id"];
            isOneToOne: false;
            referencedRelation: "invites";
            referencedColumns: ["id"];
          },
        ];
      };
      season_phases: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          name: string;
          season_id: string;
          starts_on: string;
          track: Database["public"]["Enums"]["track"];
          weekly_hours: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          name: string;
          season_id: string;
          starts_on: string;
          track: Database["public"]["Enums"]["track"];
          weekly_hours: number;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          name?: string;
          season_id?: string;
          starts_on?: string;
          track?: Database["public"]["Enums"]["track"];
          weekly_hours?: number;
        };
        Relationships: [
          {
            foreignKeyName: "season_phases_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      seasons: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          is_current: boolean;
          name: string;
          starts_on: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          is_current?: boolean;
          name: string;
          starts_on: string;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          is_current?: boolean;
          name?: string;
          starts_on?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          auto_closed: boolean;
          check_in: string;
          check_out: string | null;
          created_at: string;
          credited_minutes: number | null;
          discarded: boolean;
          id: string;
          member_id: string;
        };
        ComputedFields: never;
        Insert: {
          auto_closed?: boolean;
          check_in?: string;
          check_out?: string | null;
          created_at?: string;
          credited_minutes?: number | null;
          discarded?: boolean;
          id?: string;
          member_id: string;
        };
        Update: {
          auto_closed?: boolean;
          check_in?: string;
          check_out?: string | null;
          created_at?: string;
          credited_minutes?: number | null;
          discarded?: boolean;
          id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      app_timezone: { Args: Record<PropertyKey, never>; Returns: string };
      close_stale_sessions: { Args: { p_now?: string }; Returns: number };
      create_invite: {
        Args: {
          p_category?: Database["public"]["Enums"]["category"];
          p_expires_in_days?: number;
          p_label?: string;
          p_max_uses?: number;
          p_type: Database["public"]["Enums"]["member_type"];
        };
        Returns: {
          id: string;
          token: string;
        }[];
      };
      current_member_id: { Args: Record<PropertyKey, never>; Returns: string };
      current_season_id: { Args: Record<PropertyKey, never>; Returns: string };
      expected_full_minutes: {
        Args: { p_season_id: string; p_track: Database["public"]["Enums"]["track"] };
        Returns: number;
      };
      expected_minutes: {
        Args: { p_at?: string; p_season_id: string; p_track: Database["public"]["Enums"]["track"] };
        Returns: number;
      };
      hash_invite_token: { Args: { p_token: string }; Returns: string };
      invite_preview: { Args: { p_token: string }; Returns: Json };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      kiosk_checkout: { Args: { p_member_id: string }; Returns: Json };
      kiosk_present: {
        Args: Record<PropertyKey, never>;
        Returns: {
          check_in: string;
          member_id: string;
          name: string;
        }[];
      };
      kiosk_toggle: { Args: { p_code: string }; Returns: Json };
      local_day_start: { Args: { p_day: string }; Returns: string };
      member_track: {
        Args: {
          p_category: Database["public"]["Enums"]["category"];
          p_type: Database["public"]["Enums"]["member_type"];
        };
        Returns: Database["public"]["Enums"]["track"];
      };
      member_worked_minutes: {
        Args: { p_from: string; p_member_id: string; p_now?: string; p_to: string };
        Returns: number;
      };
      my_stats: {
        Args: { p_at?: string; p_season_id?: string };
        Returns: {
          current_phase: string;
          expected_full_minutes: number;
          expected_minutes: number;
          pct_season: number;
          pct_to_date: number;
          phase_minutes: number;
          position: number;
          season_minutes: number;
          total: number;
          track: Database["public"]["Enums"]["track"];
          week_minutes: number;
        }[];
      };
      ranking: {
        Args: { p_at?: string; p_season_id: string; p_track: Database["public"]["Enums"]["track"] };
        Returns: Database["public"]["CompositeTypes"]["ranking_row"][];
        SetofOptions: {
          from: "*";
          to: "ranking_row";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      ranking_unchecked: {
        Args: { p_at?: string; p_season_id: string; p_track: Database["public"]["Enums"]["track"] };
        Returns: Database["public"]["CompositeTypes"]["ranking_row"][];
        SetofOptions: {
          from: "*";
          to: "ranking_row";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      redeem_invite: {
        Args: {
          p_category?: Database["public"]["Enums"]["category"];
          p_code?: string;
          p_locale?: string;
          p_name: string;
          p_token: string;
        };
        Returns: {
          active: boolean;
          category: Database["public"]["Enums"]["category"];
          code: string;
          created_at: string;
          id: string;
          invite_id: string | null;
          locale: string;
          name: string;
          type: Database["public"]["Enums"]["member_type"];
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "members";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      request_correction: {
        Args: { p_check_out: string; p_note?: string; p_session_id: string };
        Returns: {
          created_at: string;
          id: string;
          member_id: string;
          note: string | null;
          requested_check_out: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          session_id: string;
          status: Database["public"]["Enums"]["request_status"];
        };
        SetofOptions: {
          from: "*";
          to: "correction_requests";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      review_correction: {
        Args: { p_approve: boolean; p_request_id: string };
        Returns: {
          created_at: string;
          id: string;
          member_id: string;
          note: string | null;
          requested_check_out: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          session_id: string;
          status: Database["public"]["Enums"]["request_status"];
        };
        SetofOptions: {
          from: "*";
          to: "correction_requests";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      session_minutes: {
        Args: {
          p_from: string;
          p_now?: string;
          p_session: Omit<
            Database["public"]["Tables"]["sessions"]["Row"],
            Database["public"]["Tables"]["sessions"]["ComputedFields"]
          >;
          p_to: string;
        };
        Returns: number;
      };
      set_current_season: { Args: { p_season_id: string }; Returns: undefined };
    };
    Enums: {
      category: "FRC" | "FTC";
      member_type: "student" | "mentor";
      request_status: "pending" | "approved" | "rejected";
      track: "FRC_STUDENTS" | "FTC_STUDENTS" | "MENTORS";
    };
    CompositeTypes: {
      ranking_row: {
        position: number | null;
        member_id: string | null;
        name: string | null;
        week_minutes: number | null;
        phase_minutes: number | null;
        season_minutes: number | null;
        expected_minutes: number | null;
        expected_full_minutes: number | null;
        pct_to_date: number | null;
        pct_season: number | null;
        current_phase: string | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      category: ["FRC", "FTC"],
      member_type: ["student", "mentor"],
      request_status: ["pending", "approved", "rejected"],
      track: ["FRC_STUDENTS", "FTC_STUDENTS", "MENTORS"],
    },
  },
} as const;

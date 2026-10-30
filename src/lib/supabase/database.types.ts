
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assistant_usage": {
                  Row: {
                    "created_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assistant_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"case_checks": {
                  Row: {
                    "case_id": string | null,"created_at": string,"duration_ms": number,"error_code": string | null,"http_status": number | null,"id": string,"requested_by": string | null,"result": string,"trigger": string
                  }
                  ComputedFields: never
                  Insert: {
                    "case_id"?: string | null,"created_at"?: string,"duration_ms": number,"error_code"?: string | null,"http_status"?: number | null,"id"?: string,"requested_by"?: string | null,"result": string,"trigger": string
                  }
                  Update: {
                    "case_id"?: string | null,"created_at"?: string,"duration_ms"?: number,"error_code"?: string | null,"http_status"?: number | null,"id"?: string,"requested_by"?: string | null,"result"?: string,"trigger"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "case_checks_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "case_checks_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cases": {
                  Row: {
                    "check_state": string,"created_at": string,"description_en": string | null,"description_es": string | null,"form_type": string | null,"id": string,"last_checked_at": string | null,"last_error_code": string | null,"last_successful_check_at": string | null,"receipt_number": string,"status_category": string | null,"status_en": string | null,"status_es": string | null,"submitted_at": string | null,"uscis_modified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "check_state"?: string,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"form_type"?: string | null,"id"?: string,"last_checked_at"?: string | null,"last_error_code"?: string | null,"last_successful_check_at"?: string | null,"receipt_number": string,"status_category"?: string | null,"status_en"?: string | null,"status_es"?: string | null,"submitted_at"?: string | null,"uscis_modified_at"?: string | null
                  }
                  Update: {
                    "check_state"?: string,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"form_type"?: string | null,"id"?: string,"last_checked_at"?: string | null,"last_error_code"?: string | null,"last_successful_check_at"?: string | null,"receipt_number"?: string,"status_category"?: string | null,"status_en"?: string | null,"status_es"?: string | null,"submitted_at"?: string | null,"uscis_modified_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"consents": {
                  Row: {
                    "granted_at": string,"id": string,"kind": string,"revoked_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"id"?: string,"kind": string,"revoked_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"id"?: string,"kind"?: string,"revoked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"key_dates": {
                  Row: {
                    "created_at": string,"created_by": string,"date": string,"id": string,"kind": string,"notes": string | null,"time": string | null,"title": string,"tracked_case_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"date": string,"id"?: string,"kind": string,"notes"?: string | null,"time"?: string | null,"title": string,"tracked_case_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"date"?: string,"id"?: string,"kind"?: string,"notes"?: string | null,"time"?: string | null,"title"?: string,"tracked_case_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "key_dates_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "key_dates_tracked_case_id_fkey"
      columns: ["tracked_case_id"]
isOneToOne: false
      referencedRelation: "tracked_cases"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications_sent": {
                  Row: {
                    "id": string,"sent_at": string,"status_event_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"sent_at"?: string,"status_event_id": string,"user_id": string
                  }
                  Update: {
                    "id"?: string,"sent_at"?: string,"status_event_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_sent_status_event_id_fkey"
      columns: ["status_event_id"]
isOneToOne: false
      referencedRelation: "status_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_sent_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string,"locale": string,"notify_on_change": boolean,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string,"id": string,"locale"?: string,"notify_on_change"?: boolean,"role": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"locale"?: string,"notify_on_change"?: boolean,"role"?: string
                  }
                  Relationships: [
                    
                  ]
                },"shares": {
                  Row: {
                    "attorney_email": string,"created_at": string,"id": string,"revoked_at": string | null,"tracked_case_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attorney_email": string,"created_at"?: string,"id"?: string,"revoked_at"?: string | null,"tracked_case_id": string
                  }
                  Update: {
                    "attorney_email"?: string,"created_at"?: string,"id"?: string,"revoked_at"?: string | null,"tracked_case_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shares_tracked_case_id_fkey"
      columns: ["tracked_case_id"]
isOneToOne: false
      referencedRelation: "tracked_cases"
      referencedColumns: ["id"]
    }
                  ]
                },"status_events": {
                  Row: {
                    "case_id": string,"category": string,"created_at": string,"description_en": string | null,"description_es": string | null,"id": string,"observed_at": string | null,"occurred_on": string,"origin": string,"text_en": string,"text_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "case_id": string,"category": string,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"id"?: string,"observed_at"?: string | null,"occurred_on": string,"origin": string,"text_en": string,"text_es"?: string | null
                  }
                  Update: {
                    "case_id"?: string,"category"?: string,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"id"?: string,"observed_at"?: string | null,"occurred_on"?: string,"origin"?: string,"text_en"?: string,"text_es"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "status_events_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id"]
    }
                  ]
                },"tracked_cases": {
                  Row: {
                    "case_id": string,"client_id": string,"created_at": string,"id": string,"last_viewed_at": string | null,"nickname": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "case_id": string,"client_id": string,"created_at"?: string,"id"?: string,"last_viewed_at"?: string | null,"nickname"?: string | null
                  }
                  Update: {
                    "case_id"?: string,"client_id"?: string,"created_at"?: string,"id"?: string,"last_viewed_at"?: string | null,"nickname"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tracked_cases_case_id_fkey"
      columns: ["case_id"]
isOneToOne: false
      referencedRelation: "cases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tracked_cases_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "attorney_shared_cases":
{ Args: Record<PropertyKey, never>; Returns: {
              "case_id": string,"check_state": string,"client_name": string,"form_type": string,"last_change_on": string,"last_successful_check_at": string,"next_key_date": string,"nickname": string,"receipt_number": string,"share_id": string,"shared_at": string,"status_category": string,"status_en": string,"status_es": string,"tracked_case_id": string
            }[]
                           },
"can_access_tracked_case":
{ Args: { "target_tracked_case_id": string }; Returns: boolean
                           },
"can_read_case":
{ Args: { "target_case_id": string }; Returns: boolean
                           },
"confirmed_attorney_emails":
{ Args: { "candidate_emails": (string)[] }; Returns: string[]
                           },
"current_attorney_email":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"insights_by_form_type":
{ Args: Record<PropertyKey, never>; Returns: {
              "case_count": number,"form_type": string,"median_days": number,"p25_days": number,"p75_days": number
            }[]
                           },
"is_shared_attorney":
{ Args: { "target_tracked_case_id": string }; Returns: boolean
                           },
"owns_tracked_case":
{ Args: { "target_tracked_case_id": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

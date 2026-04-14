/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_attendance from "../functions/attendance.js";
import type * as functions_auth from "../functions/auth.js";
import type * as functions_candidates from "../functions/candidates.js";
import type * as functions_documents from "../functions/documents.js";
import type * as functions_invitations from "../functions/invitations.js";
import type * as functions_invite_action from "../functions/invite_action.js";
import type * as functions_management from "../functions/management.js";
import type * as functions_offers from "../functions/offers.js";
import type * as functions_settings from "../functions/settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/attendance": typeof functions_attendance;
  "functions/auth": typeof functions_auth;
  "functions/candidates": typeof functions_candidates;
  "functions/documents": typeof functions_documents;
  "functions/invitations": typeof functions_invitations;
  "functions/invite_action": typeof functions_invite_action;
  "functions/management": typeof functions_management;
  "functions/offers": typeof functions_offers;
  "functions/settings": typeof functions_settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

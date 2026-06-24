# Smart Farm Intelligence Platform

The central hub for managing agricultural fields, providing insights, and tracking manual tasks.

## Language

**Task**:
A manual checklist item that a user creates for themselves, which can optionally have a due date.
_Avoid_: ActionItem, Recommendation, AutoTask.

**Profile Statistics**:
Aggregated data associated with a user's account, such as total acres managed, total number of fields, and subscription tier.
_Avoid_: User Stats, Account Info.

**Current Location Weather**:
Weather data retrieved dynamically based on the user's browser geolocation, rather than being tied to a specific field's location.
_Avoid_: Field Weather, Local Weather.

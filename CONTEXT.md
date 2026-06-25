# Smart Farm Intelligence Platform

The central hub for managing agricultural fields, providing insights, and tracking manual tasks.

## Language

**Task**:
A manual checklist item that a user creates for themselves, which can optionally have a due date and a category.
_Avoid_: ActionItem, Recommendation, AutoTask.

**Task Category**:
A classification for a Task, used to color-code and organize activities (e.g. 'Plowing', 'Fertilization', 'Shipment', 'General').
_Avoid_: Task Type, Activity Type.

**Profile Statistics**:
Aggregated data associated with a user's account, such as total acres managed, total number of fields, and subscription tier.
_Avoid_: User Stats, Account Info.

**Current Location Weather**:
Weather data retrieved dynamically based on the user's browser geolocation, rather than being tied to a specific field's location.
_Avoid_: Field Weather, Local Weather.

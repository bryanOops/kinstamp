-- "Card Was Mailed To Me" and "Card Was Picked Up By USPS" now categorize as card_produced
-- (the card is on its way) instead of card_delivered (the card is in hand). Categories are
-- stored when a check runs, so rows categorized under the old rule are updated here.

update public.cases
set status_category = 'card_produced'
where status_category = 'card_delivered'
  and status_en ~* '(card .*(mailed|picked up)|(mailed|picked up) .*card)'
  and status_en !~* 'delivered';

update public.status_events
set category = 'card_produced'
where category = 'card_delivered'
  and text_en ~* '(card .*(mailed|picked up)|(mailed|picked up) .*card)'
  and text_en !~* 'delivered';

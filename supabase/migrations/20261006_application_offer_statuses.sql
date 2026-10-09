alter type "ApplicationStatus" add value if not exists 'OFFER_SENT';
alter type "ApplicationStatus" add value if not exists 'OFFER_ACCEPTED';
alter type "ApplicationStatus" add value if not exists 'OFFER_DECLINED';
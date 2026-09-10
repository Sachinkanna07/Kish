import type { Bilingual, Language } from '../types'

/**
 * Every user-facing string lives here in both languages.
 *
 * Tamil is written the way a procurement clerk would actually speak to a
 * farmer — short sentences, everyday words ("ஊர்" not "கிராமம்", "கைபேசி எண்"
 * not "நகர்பேசி எண்") — rather than a literal translation of the English.
 */
export const strings = {
  /* ---- brand ---- */
  'brand.name': { en: 'DOT', ta: 'DOT' },
  'brand.team': { en: 'By DOT Team', ta: 'DOT குழுவினரால்' },
  'brand.tagline': {
    en: 'Smart digital procurement for farmers',
    ta: 'விவசாயிகளுக்கான எளிய டிஜிட்டல் கொள்முதல்',
  },

  /* ---- common ---- */
  'common.continue': { en: 'Continue', ta: 'தொடரவும்' },
  'common.back': { en: 'Back', ta: 'பின்செல்' },
  'common.next': { en: 'Next', ta: 'அடுத்து' },
  'common.cancel': { en: 'Cancel', ta: 'வேண்டாம்' },
  'common.close': { en: 'Close', ta: 'மூடு' },
  'common.change': { en: 'Change', ta: 'மாற்று' },
  'common.confirm': { en: 'Confirm', ta: 'உறுதி செய்' },
  'common.viewAll': { en: 'View all', ta: 'எல்லாம் பார்க்க' },
  'common.step': { en: 'Step {n} of {total}', ta: 'படி {n} / {total}' },
  'common.km': { en: 'km', ta: 'கி.மீ' },
  'common.kg': { en: 'kg', ta: 'கிலோ' },
  'common.quintal': { en: 'quintal', ta: 'குவிண்டால்' },
  'common.min': { en: 'min', ta: 'நிமிடம்' },
  'common.minutes': { en: '{n} min', ta: '{n} நிமிடம்' },
  'common.hours': { en: '{h} hr {m} min', ta: '{h} மணி {m} நிமிடம்' },
  'common.today': { en: 'Today', ta: 'இன்று' },
  'common.tomorrow': { en: 'Tomorrow', ta: 'நாளை' },
  'common.yes': { en: 'Yes', ta: 'ஆம்' },
  'common.no': { en: 'No', ta: 'இல்லை' },
  'common.listen': { en: 'Listen', ta: 'கேட்க' },
  'common.stop': { en: 'Stop', ta: 'நிறுத்து' },
  'common.textSize': { en: 'Text size', ta: 'எழுத்து அளவு' },
  'common.help': { en: 'Help', ta: 'உதவி' },
  'common.offline': {
    en: 'You are offline. The numbers below are the last ones DOT received.',
    ta: 'இணையம் இல்லை. கீழே உள்ளவை DOT கடைசியாகப் பெற்ற தகவல்கள்.',
  },
  'common.demoData': {
    en: 'Prototype: figures are sample data, not a live government feed.',
    ta: 'மாதிரி பதிப்பு: இங்குள்ள எண்கள் மாதிரித் தரவு, நேரடி அரசுத் தகவல் அல்ல.',
  },

  /* ---- landing ---- */
  'landing.headline': { en: 'A simpler way to sell your produce.', ta: 'உங்கள் விளைச்சலை விற்க எளிய வழி.' },
  'landing.body': {
    en: 'DOT helps you choose the right procurement centre, book your time, carry a digital token, watch the queue and follow your payment — all from your phone.',
    ta: 'சரியான கொள்முதல் நிலையத்தைத் தேர்ந்தெடுக்க, நேரம் பதிவு செய்ய, டிஜிட்டல் டோக்கன் வைத்திருக்க, வரிசையைப் பார்க்க, பணம் வந்ததா என அறிய — எல்லாமே உங்கள் கைபேசியில்.',
  },
  'landing.cta': { en: 'Get started', ta: 'தொடங்கவும்' },
  'landing.existing': { en: 'I already use DOT', ta: 'நான் ஏற்கனவே DOT பயன்படுத்துகிறேன்' },

  /* ---- language ---- */
  'language.title': { en: 'Choose your language', ta: 'உங்கள் மொழியைத் தேர்ந்தெடுங்கள்' },
  'language.subtitle': {
    en: 'You can change this later from your profile.',
    ta: 'இதை பின்னர் சுயவிவரத்தில் மாற்றிக்கொள்ளலாம்.',
  },

  /* ---- login ---- */
  'login.title': { en: 'Login', ta: 'உள்நுழைவு' },
  'login.subtitle': {
    en: 'Enter the mobile number registered for your land.',
    ta: 'உங்கள் நிலத்திற்குப் பதிவு செய்யப்பட்ட கைபேசி எண்ணை உள்ளிடவும்.',
  },
  'login.mobile': { en: 'Mobile number', ta: 'கைபேசி எண்' },
  'login.mobileHint': { en: '10 digit number', ta: '10 இலக்க எண்' },
  'login.action': { en: 'Send OTP', ta: 'OTP அனுப்பு' },
  'login.invalid': {
    en: 'Please enter a valid 10 digit mobile number.',
    ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.',
  },
  'login.terms': {
    en: 'DOT is a demonstration prototype built by DOT Team.',
    ta: 'DOT என்பது DOT குழுவினர் உருவாக்கிய மாதிரிப் பயன்பாடு.',
  },

  /* ---- otp ---- */
  'otp.title': { en: 'Verify your number', ta: 'உங்கள் எண்ணைச் சரிபார்க்கவும்' },
  'otp.subtitle': { en: 'We sent a 6 digit code to {phone}', ta: '{phone} எண்ணுக்கு 6 இலக்கக் குறியீடு அனுப்பியுள்ளோம்' },
  'otp.action': { en: 'Verify and continue', ta: 'சரிபார்த்து தொடரவும்' },
  'otp.resend': { en: 'Resend code', ta: 'மீண்டும் அனுப்பு' },
  'otp.resendIn': { en: 'Resend code in {n}s', ta: '{n} விநாடியில் மீண்டும் அனுப்பலாம்' },
  'otp.wrong': { en: 'That code did not match. Please try again.', ta: 'குறியீடு பொருந்தவில்லை. மீண்டும் முயற்சிக்கவும்.' },
  'otp.demoHint': { en: 'Prototype code: {code}', ta: 'மாதிரிக் குறியீடு: {code}' },
  'otp.changeNumber': { en: 'Use a different number', ta: 'வேறு எண்ணைப் பயன்படுத்து' },

  /* ---- role ---- */
  'role.title': { en: 'How will you use DOT?', ta: 'DOT-ஐ நீங்கள் எப்படிப் பயன்படுத்துவீர்கள்?' },
  'role.subtitle': { en: 'Choose the one that matches your work.', ta: 'உங்கள் பணிக்குப் பொருந்துவதைத் தேர்ந்தெடுங்கள்.' },
  'role.farmer': { en: 'Farmer', ta: 'விவசாயி' },
  'role.farmerDesc': {
    en: 'Sell your produce at a procurement centre.',
    ta: 'கொள்முதல் நிலையத்தில் உங்கள் விளைச்சலை விற்க.',
  },
  'role.centre': { en: 'Procurement centre', ta: 'கொள்முதல் நிலையம்' },
  'role.centreDesc': {
    en: 'Call tokens, weigh produce and close the day.',
    ta: 'டோக்கன் அழைக்க, எடை போட, நாள் கணக்கை முடிக்க.',
  },
  'role.admin': { en: 'Administration', ta: 'நிர்வாகம்' },
  'role.adminDesc': {
    en: 'Watch centres, volumes and payments across the district.',
    ta: 'மாவட்டத்தில் நிலையங்கள், அளவு, பணப் பட்டுவாடாவைக் கண்காணிக்க.',
  },

  /* ---- nav ---- */
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.book': { en: 'Book', ta: 'பதிவு' },
  'nav.token': { en: 'Token', ta: 'டோக்கன்' },
  'nav.alerts': { en: 'Alerts', ta: 'அறிவிப்பு' },
  'nav.profile': { en: 'Profile', ta: 'சுயவிவரம்' },
  'nav.dashboard': { en: 'Dashboard', ta: 'பணிமேசை' },
  'nav.queue': { en: 'Queue', ta: 'வரிசை' },
  'nav.overview': { en: 'Overview', ta: 'கண்ணோட்டம்' },
  'nav.centres': { en: 'Centres', ta: 'நிலையங்கள்' },

  /* ---- home ---- */
  'home.morning': { en: 'Good morning', ta: 'காலை வணக்கம்' },
  'home.afternoon': { en: 'Good afternoon', ta: 'மதிய வணக்கம்' },
  'home.evening': { en: 'Good evening', ta: 'மாலை வணக்கம்' },
  'home.subtitle': { en: "Here is today's mandi update.", ta: 'இன்றைய மண்டி நிலவரம் இதோ.' },
  'home.noToken': { en: 'You have no booking today', ta: 'இன்று உங்களுக்கு முன்பதிவு இல்லை' },
  'home.noTokenBody': {
    en: 'Book a time at a centre and DOT will give you a token, so you do not have to stand in line.',
    ta: 'ஒரு நிலையத்தில் நேரம் பதிவு செய்யுங்கள். DOT உங்களுக்கு டோக்கன் தரும் — வரிசையில் நிற்க வேண்டாம்.',
  },
  'home.bookNow': { en: 'Book procurement', ta: 'கொள்முதல் பதிவு செய்' },
  'home.yourToken': { en: 'Your token today', ta: 'இன்றைய உங்கள் டோக்கன்' },
  'home.track': { en: 'Track queue', ta: 'வரிசையைப் பார்' },
  'home.quickActions': { en: 'What do you want to do?', ta: 'நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?' },
  'home.nearby': { en: 'Centres near you', ta: 'உங்கள் அருகில் உள்ள நிலையங்கள்' },
  'home.rates': { en: "Today's rates", ta: 'இன்றைய விலை' },
  'home.ratesSub': { en: 'Best rate available near you, per quintal.', ta: 'உங்கள் அருகில் கிடைக்கும் சிறந்த விலை, குவிண்டாலுக்கு.' },
  'home.explainTitle': { en: 'How DOT chooses for you', ta: 'DOT எப்படித் தேர்ந்தெடுக்கிறது' },
  'home.explainBody': {
    en: 'DOT adds up three things for every centre — how far you must travel, how long the queue is, and what rate they are paying today. The centre that leaves the most money in your hand for the least time is the one we suggest.',
    ta: 'ஒவ்வொரு நிலையத்திற்கும் மூன்று விஷயங்களை DOT கணக்கிடுகிறது — நீங்கள் பயணிக்க வேண்டிய தூரம், வரிசையின் நீளம், இன்று அவர்கள் தரும் விலை. குறைந்த நேரத்தில் அதிக பணம் கிடைக்கும் நிலையத்தையே நாங்கள் பரிந்துரைக்கிறோம்.',
  },

  /* ---- quick actions ---- */
  'action.book': { en: 'Book token', ta: 'டோக்கன் பதிவு' },
  'action.bookSub': { en: 'Reserve your time at a centre', ta: 'நிலையத்தில் நேரம் பதிவு செய்யுங்கள்' },
  'action.trackSub': { en: 'See how many are ahead of you', ta: 'உங்களுக்கு முன் எத்தனை பேர் என்று பாருங்கள்' },
  'action.procurement': { en: 'My procurement', ta: 'என் கொள்முதல்' },
  'action.procurementSub': { en: 'Everything you have sold', ta: 'நீங்கள் விற்ற அனைத்தும்' },
  'action.payment': { en: 'Payment status', ta: 'பணத்தின் நிலை' },
  'action.paymentSub': { en: 'Check if money has reached you', ta: 'பணம் வந்ததா என்று பாருங்கள்' },

  /* ---- centre card ---- */
  'centre.distance': { en: 'Distance', ta: 'தூரம்' },
  'centre.wait': { en: 'Waiting', ta: 'காத்திருப்பு' },
  'centre.rate': { en: 'Rate', ta: 'விலை' },
  'centre.perQuintal': { en: 'per quintal', ta: 'குவிண்டாலுக்கு' },
  'centre.inQueue': { en: '{n} farmers in queue', ta: 'வரிசையில் {n} விவசாயிகள்' },
  'centre.space': { en: 'Space left', ta: 'மீதமுள்ள இடம்' },
  'centre.tonnes': { en: '{n} tonnes', ta: '{n} டன்' },
  'centre.facilities': { en: 'Facilities', ta: 'வசதிகள்' },
  'centre.call': { en: 'Call centre', ta: 'நிலையத்தை அழை' },
  'centre.openUntil': { en: 'Open until {time}', ta: '{time} வரை திறந்திருக்கும்' },
  'centre.closedNow': { en: 'Closed now', ta: 'இப்போது மூடப்பட்டுள்ளது' },

  /* ---- load states ---- */
  'load.free': { en: 'No waiting', ta: 'காத்திருப்பு இல்லை' },
  'load.normal': { en: 'Normal', ta: 'சாதாரணம்' },
  'load.busy': { en: 'Busy', ta: 'கூட்டம்' },
  'load.congested': { en: 'Very crowded', ta: 'மிகுந்த கூட்டம்' },
  'load.closed': { en: 'Closed', ta: 'மூடப்பட்டது' },

  /* ---- booking: crop ---- */
  'book.cropTitle': { en: 'What are you selling?', ta: 'என்ன விற்கப் போகிறீர்கள்?' },
  'book.cropSub': { en: 'Choose one crop for this booking.', ta: 'இந்தப் பதிவுக்கு ஒரு பயிரைத் தேர்ந்தெடுங்கள்.' },
  'book.msp': { en: 'Support price {amount}', ta: 'ஆதரவு விலை {amount}' },

  /* ---- booking: quantity ---- */
  'book.qtyTitle': { en: 'How much are you bringing?', ta: 'எவ்வளவு கொண்டு வருகிறீர்கள்?' },
  'book.qtySub': {
    en: 'A rough number is fine. The centre will weigh it again.',
    ta: 'தோராயமான எண் போதும். நிலையத்தில் மீண்டும் எடை போடுவார்கள்.',
  },
  'book.qtyLabel': { en: 'Quantity in kilograms', ta: 'அளவு (கிலோ)' },
  'book.qtyQuintals': { en: 'That is about {n} quintals', ta: 'அதாவது சுமார் {n} குவிண்டால்' },
  'book.qtyTooSmall': { en: 'Enter at least 10 kg.', ta: 'குறைந்தது 10 கிலோ உள்ளிடவும்.' },
  'book.qtyTooLarge': { en: 'For more than 20 tonnes, please contact the centre directly.', ta: '20 டன்னுக்கு மேல் என்றால் நேரடியாக நிலையத்தைத் தொடர்பு கொள்ளவும்.' },

  /* ---- booking: recommendation ---- */
  'book.recoTitle': { en: 'DOT suggests this centre', ta: 'DOT இந்த நிலையத்தைப் பரிந்துரைக்கிறது' },
  'book.recoSub': { en: 'For {qty} kg of {crop}', ta: '{qty} கிலோ {crop}-க்கு' },
  'book.recoBadge': { en: 'Best for you', ta: 'உங்களுக்குச் சிறந்தது' },
  'book.whyThis': { en: 'Why this centre', ta: 'ஏன் இந்த நிலையம்' },
  'book.youGet': { en: 'You should receive about', ta: 'உங்களுக்குக் கிடைக்கும் தொகை சுமார்' },
  'book.timeCost': { en: 'Travel + waiting', ta: 'பயணம் + காத்திருப்பு' },
  'book.compare': { en: 'Compare all centres', ta: 'எல்லா நிலையங்களையும் ஒப்பிடு' },
  'book.acceptReco': { en: 'Book at this centre', ta: 'இந்த நிலையத்தில் பதிவு செய்' },
  'book.vsNearest': { en: '{amount} more than the nearest centre', ta: 'அருகிலுள்ள நிலையத்தை விட {amount} அதிகம்' },
  'book.vsNearestLess': { en: '{amount} less than the nearest centre', ta: 'அருகிலுள்ள நிலையத்தை விட {amount} குறைவு' },

  /* ---- booking: centre list ---- */
  'book.centreTitle': { en: 'Choose a procurement centre', ta: 'கொள்முதல் நிலையத்தைத் தேர்ந்தெடுங்கள்' },
  'book.centreSub': { en: 'Sorted by what suits you best.', ta: 'உங்களுக்குப் பொருத்தமான வரிசையில்.' },
  'book.noRoom': { en: 'Not enough space today', ta: 'இன்று இடம் போதவில்லை' },

  /* ---- booking: slot ---- */
  'book.slotTitle': { en: 'Pick your time', ta: 'உங்கள் நேரத்தைத் தேர்ந்தெடுங்கள்' },
  'book.slotSub': { en: 'Reach the centre inside this window.', ta: 'இந்த நேரத்திற்குள் நிலையத்தை அடையுங்கள்.' },
  'book.slotsLeft': { en: '{n} left', ta: '{n} இடம் மீதம்' },
  'book.slotFull': { en: 'Full', ta: 'நிரம்பியது' },
  'book.slotPast': { en: 'Time passed', ta: 'நேரம் முடிந்தது' },
  'book.noSlots': { en: 'No times left at this centre today.', ta: 'இன்று இந்த நிலையத்தில் நேரம் மீதம் இல்லை.' },

  /* ---- booking: summary ---- */
  'book.summaryTitle': { en: 'Check before you confirm', ta: 'உறுதி செய்வதற்கு முன் பாருங்கள்' },
  'book.crop': { en: 'Crop', ta: 'பயிர்' },
  'book.quantity': { en: 'Quantity', ta: 'அளவு' },
  'book.centre': { en: 'Centre', ta: 'நிலையம்' },
  'book.date': { en: 'Date', ta: 'தேதி' },
  'book.time': { en: 'Time', ta: 'நேரம்' },
  'book.expected': { en: 'Expected amount', ta: 'எதிர்பார்க்கும் தொகை' },
  'book.expectedNote': {
    en: 'Final amount depends on the weight and grade recorded at the centre.',
    ta: 'இறுதித் தொகை நிலையத்தில் பதிவாகும் எடை மற்றும் தரத்தைப் பொறுத்தது.',
  },
  'book.confirm': { en: 'Confirm booking', ta: 'பதிவை உறுதி செய்' },

  /* ---- token ---- */
  'token.title': { en: 'Your digital token', ta: 'உங்கள் டிஜிட்டல் டோக்கன்' },
  'token.booked': { en: 'Booking confirmed', ta: 'பதிவு உறுதியானது' },
  'token.number': { en: 'Token number', ta: 'டோக்கன் எண்' },
  'token.showThis': {
    en: 'Show this token at the centre gate. No printout needed.',
    ta: 'நிலைய நுழைவாயிலில் இந்த டோக்கனைக் காட்டுங்கள். அச்சுப் பிரதி தேவையில்லை.',
  },
  'token.farmer': { en: 'Farmer', ta: 'விவசாயி' },
  'token.farmerId': { en: 'Farmer ID', ta: 'விவசாயி எண்' },
  'token.reference': { en: 'Reference', ta: 'குறிப்பு எண்' },
  'token.arriveBy': { en: 'Reach by', ta: 'இதற்குள் வாருங்கள்' },
  'token.none': { en: 'No token yet', ta: 'இன்னும் டோக்கன் இல்லை' },
  'token.noneBody': {
    en: 'Book a procurement slot and your token will appear here.',
    ta: 'கொள்முதல் நேரம் பதிவு செய்தால் உங்கள் டோக்கன் இங்கே தோன்றும்.',
  },
  'token.cancel': { en: 'Cancel this booking', ta: 'இந்தப் பதிவை ரத்து செய்' },
  'token.cancelConfirm': {
    en: 'Cancel this booking? Your slot will be given to another farmer.',
    ta: 'இந்தப் பதிவை ரத்து செய்யவா? உங்கள் நேரம் வேறு விவசாயிக்கு வழங்கப்படும்.',
  },

  /* ---- queue ---- */
  'queue.title': { en: 'Live queue', ta: 'நேரடி வரிசை' },
  'queue.nowServing': { en: 'Now serving', ta: 'இப்போது நடப்பது' },
  'queue.yourToken': { en: 'Your token', ta: 'உங்கள் டோக்கன்' },
  'queue.ahead': { en: 'Farmers ahead of you', ta: 'உங்களுக்கு முன் உள்ள விவசாயிகள்' },
  'queue.eta': { en: 'Your turn in about', ta: 'உங்கள் முறை சுமார்' },
  'queue.leaveBy': { en: 'Leave home by {time}', ta: '{time} மணிக்கு வீட்டிலிருந்து கிளம்புங்கள்' },
  'queue.leaveNow': { en: 'Leave now — your turn is close.', ta: 'இப்போதே கிளம்புங்கள் — உங்கள் முறை நெருங்கிவிட்டது.' },
  'queue.yourTurn': { en: 'It is your turn. Go to the counter.', ta: 'இது உங்கள் முறை. கவுண்டருக்குச் செல்லுங்கள்.' },
  'queue.done': { en: 'Your procurement is finished.', ta: 'உங்கள் கொள்முதல் முடிந்தது.' },
  'queue.simulated': {
    en: 'Prototype: this queue moves on a simulated timer, not a live centre feed.',
    ta: 'மாதிரி பதிப்பு: இந்த வரிசை மாதிரி நேரக் கணக்கில் நகர்கிறது, நேரடித் தகவல் அல்ல.',
  },
  'queue.progress': { en: '{done} of {total} done', ta: '{total}-இல் {done} முடிந்தது' },

  /* ---- procurement ---- */
  'proc.title': { en: 'My procurement', ta: 'என் கொள்முதல்' },
  'proc.sub': { en: 'Everything you have brought to a centre.', ta: 'நீங்கள் நிலையத்திற்குக் கொண்டு வந்த அனைத்தும்.' },
  'proc.empty': { en: 'Nothing yet. Your first booking will show here.', ta: 'இன்னும் எதுவும் இல்லை. உங்கள் முதல் பதிவு இங்கே தெரியும்.' },
  'proc.weighed': { en: 'Weighed', ta: 'எடை' },
  'proc.grade': { en: 'Grade', ta: 'தரம்' },
  'proc.amount': { en: 'Amount', ta: 'தொகை' },
  'proc.totalSold': { en: 'Total sold', ta: 'மொத்த விற்பனை' },
  'proc.totalEarned': { en: 'Total earned', ta: 'மொத்த வருமானம்' },

  /* ---- status ---- */
  'status.booked': { en: 'Booked', ta: 'பதிவு செய்யப்பட்டது' },
  'status.arrived': { en: 'At centre', ta: 'நிலையத்தில்' },
  'status.weighing': { en: 'Weighing', ta: 'எடை போடப்படுகிறது' },
  'status.completed': { en: 'Completed', ta: 'முடிந்தது' },
  'status.payment_pending': { en: 'Payment pending', ta: 'பணம் வர வேண்டும்' },
  'status.paid': { en: 'Paid', ta: 'பணம் வந்தது' },
  'status.cancelled': { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },

  /* ---- payment ---- */
  'pay.title': { en: 'Payment status', ta: 'பணத்தின் நிலை' },
  'pay.sub': { en: 'Money for the produce you have sold.', ta: 'நீங்கள் விற்ற விளைச்சலுக்கான பணம்.' },
  'pay.awaiting': { en: 'Waiting to be paid', ta: 'பணம் வர வேண்டியது' },
  'pay.received': { en: 'Received', ta: 'பெறப்பட்டது' },
  'pay.breakdown': { en: 'How this amount was worked out', ta: 'இந்தத் தொகை எப்படிக் கணக்கிடப்பட்டது' },
  'pay.gross': { en: '{qty} kg at {rate} per quintal', ta: 'குவிண்டாலுக்கு {rate} வீதம் {qty} கிலோ' },
  'pay.gradeAdj': { en: 'Grade {grade} adjustment', ta: 'தரம் {grade} சரிக்கட்டல்' },
  'pay.net': { en: 'Net payable', ta: 'நிகரத் தொகை' },
  'pay.creditedTo': { en: 'Credited to account ending {last4}', ta: '{last4} இல் முடியும் கணக்கில் வரவு' },
  'pay.expectedIn': { en: 'Usually credited within 48 hours of procurement.', ta: 'பொதுவாக கொள்முதல் முடிந்த 48 மணி நேரத்தில் வரவு வைக்கப்படும்.' },
  'pay.empty': { en: 'No payments yet.', ta: 'இன்னும் பணப் பரிவர்த்தனை இல்லை.' },

  /* ---- alerts ---- */
  'alerts.title': { en: 'Alerts', ta: 'அறிவிப்புகள்' },
  'alerts.sub': { en: 'Only things that need your attention.', ta: 'உங்கள் கவனம் தேவைப்படுவை மட்டும்.' },
  'alerts.empty': { en: 'Nothing new right now.', ta: 'இப்போது புதிதாக ஏதுமில்லை.' },
  'alerts.markRead': { en: 'Mark all as read', ta: 'எல்லாவற்றையும் படித்ததாகக் குறி' },

  /* ---- profile ---- */
  'profile.title': { en: 'Profile', ta: 'சுயவிவரம்' },
  'profile.name': { en: 'Name', ta: 'பெயர்' },
  'profile.mobile': { en: 'Mobile number', ta: 'கைபேசி எண்' },
  'profile.village': { en: 'Village', ta: 'ஊர்' },
  'profile.district': { en: 'District', ta: 'மாவட்டம்' },
  'profile.land': { en: 'Land holding', ta: 'நில அளவு' },
  'profile.acres': { en: '{n} acres', ta: '{n} ஏக்கர்' },
  'profile.language': { en: 'Language', ta: 'மொழி' },
  'profile.settings': { en: 'Display', ta: 'திரை அமைப்பு' },
  'profile.voice': { en: 'Read screens aloud', ta: 'திரையைப் படித்துக் காட்டு' },
  'profile.voiceOn': { en: 'On', ta: 'இயக்கம்' },
  'profile.voiceOff': { en: 'Off', ta: 'நிறுத்தம்' },
  'profile.logout': { en: 'Logout', ta: 'வெளியேறு' },
  'profile.reset': { en: 'Reset prototype data', ta: 'மாதிரித் தரவை மீட்டமை' },

  /* ---- centre role ---- */
  'centreApp.title': { en: 'Centre desk', ta: 'நிலையப் பணிமேசை' },
  'centreApp.today': { en: "Today at {centre}", ta: '{centre} — இன்று' },
  'centreApp.inQueue': { en: 'In queue', ta: 'வரிசையில்' },
  'centreApp.servedToday': { en: 'Served today', ta: 'இன்று முடிந்தது' },
  'centreApp.volumeToday': { en: 'Procured today', ta: 'இன்று கொள்முதல்' },
  'centreApp.capacityLeft': { en: 'Capacity left', ta: 'மீதமுள்ள திறன்' },
  'centreApp.callNext': { en: 'Call next token', ta: 'அடுத்த டோக்கனை அழை' },
  'centreApp.nowServing': { en: 'Now serving', ta: 'இப்போது நடப்பது' },
  'centreApp.bookings': { en: "Today's bookings", ta: 'இன்றைய பதிவுகள்' },
  'centreApp.recordWeight': { en: 'Record weight and grade', ta: 'எடை மற்றும் தரத்தைப் பதிவு செய்' },
  'centreApp.weightKg': { en: 'Weighed quantity (kg)', ta: 'எடை (கிலோ)' },
  'centreApp.gradeLabel': { en: 'Quality grade', ta: 'தரம்' },
  'centreApp.gradeA': { en: 'A — clean and dry (+2%)', ta: 'A — சுத்தமான, உலர்ந்த (+2%)' },
  'centreApp.gradeB': { en: 'B — standard (no change)', ta: 'B — சாதாரணம் (மாற்றம் இல்லை)' },
  'centreApp.gradeC': { en: 'C — high moisture (−3%)', ta: 'C — அதிக ஈரப்பதம் (−3%)' },
  'centreApp.complete': { en: 'Complete procurement', ta: 'கொள்முதலை முடி' },
  'centreApp.releasePayment': { en: 'Release payment', ta: 'பணத்தை விடுவி' },
  'centreApp.noQueue': { en: 'No farmers waiting.', ta: 'காத்திருக்கும் விவசாயிகள் இல்லை.' },

  /* ---- admin role ---- */
  'admin.title': { en: 'District overview', ta: 'மாவட்டக் கண்ணோட்டம்' },
  'admin.centres': { en: 'Active centres', ta: 'இயங்கும் நிலையங்கள்' },
  'admin.farmersServed': { en: 'Farmers served', ta: 'சேவை பெற்ற விவசாயிகள்' },
  'admin.volume': { en: 'Volume procured', ta: 'கொள்முதல் அளவு' },
  'admin.disbursed': { en: 'Amount disbursed', ta: 'வழங்கிய தொகை' },
  'admin.pending': { en: 'Payments pending', ta: 'நிலுவைப் பணம்' },
  'admin.avgWait': { en: 'Average wait', ta: 'சராசரி காத்திருப்பு' },
  'admin.centreTable': { en: 'Centre load', ta: 'நிலைய நிலவரம்' },
  'admin.utilisation': { en: 'Capacity used', ta: 'பயன்படுத்திய திறன்' },
  'admin.attention': { en: 'Needs attention', ta: 'கவனம் தேவை' },
  'admin.attentionBody': {
    en: '{centre} is running a {n} minute queue. Consider redirecting arrivals.',
    ta: '{centre} இல் {n} நிமிட வரிசை உள்ளது. வரும் விவசாயிகளைத் திருப்பி விடலாம்.',
  },
  'admin.allClear': { en: 'All centres are within normal waiting time.', ta: 'எல்லா நிலையங்களும் சாதாரண காத்திருப்பு நேரத்தில் உள்ளன.' },
} satisfies Record<string, Bilingual>

export type StringKey = keyof typeof strings

export function t(
  key: StringKey,
  language: Language,
  vars?: Record<string, string | number>,
): string {
  const entry = strings[key] as Bilingual
  let text = entry?.[language] ?? entry?.en ?? key

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }

  return text
}

/** Pick the right side of a `Bilingual` value coming from data files. */
export const pick = (value: Bilingual, language: Language): string => value[language] ?? value.en

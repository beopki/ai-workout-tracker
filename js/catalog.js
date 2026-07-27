window.ROUTINE_VERSION = 'v2';

window.WORKOUT_CATALOG = {
  1: [
    '인클라인 체스트 프레스 머신',
    '플랫 덤벨 프레스',
    '펙덱 플라이',
    '숄더 프레스 머신',
    '레터럴 레이즈',
    '페이스풀',
    '트라이셉스 푸시다운'
  ],

  2: [
    '랫풀다운',
    '시티드 케이블 로우',
    '머신 하이 로우',
    '원암 덤벨 로우',
    '스트레이트 암 풀다운',
    '덤벨 컬',
    '해머 컬'
  ],

  3: [
    '레그 프레스',
    '시티드 레그 컬',
    '레그 익스텐션',
    '힙 쓰러스트 머신',
    '시티드 카프 레이즈',
    '팔로프 프레스',
    '데드버그'
  ],

  4: [
    '인클라인 덤벨 프레스',
    '어시스트 풀업',
    '머신 숄더 프레스',
    '케이블 레터럴 레이즈',
    '케이블 플라이',
    '케이블 컬',
    '오버헤드 트라이셉스 익스텐션'
  ]
};

window.WORKOUT_DAY_INFO = {
  1: {
    title: 'Chest & Shoulder',
    subtitle: '가슴 · 어깨 · 삼두',
    minutes: 45
  },
  2: {
    title: 'Back & Arms',
    subtitle: '등 · 후면 어깨 · 이두',
    minutes: 45
  },
  3: {
    title: 'Legs & Core',
    subtitle: '하체 · 발목 · 코어',
    minutes: 45
  },
  4: {
    title: 'Upper Shape',
    subtitle: '상체 균형 · 자세 · 라인',
    minutes: 45
  }
};

window.getExerciseKey = function(day, index) {
  return `${window.ROUTINE_VERSION}d${day}e${index + 1}`;
};


export interface CommentCriteria {
  minScore: number;
  maxScore?: number;
  level: string;
  achievement: string;
}

export const TEST_COMMENTS: Record<string, CommentCriteria[]> = {
  'EPT': [
    {
      minScore: 20,
      maxScore: 39,
      level: '초등학교 상위 수준',
      achievement: '일상적이고 친숙한 소재의 짧은 이야기를 스스로 읽고 즐길 수 있는 단계입니다. 글에 나타난 사건의 순서를 파악하거나 그림의 도움 없이도 기본적인 줄거리를 파악하는 힘이 생겼습니다.'
    },
    {
      minScore: 40,
      level: '중학교 1학년 수준',
      achievement: '글 속에서 구체적인 정보(누가, 언제, 어디서 등)를 정확하게 찾아내는 능력이 우수합니다. 생활 밀착형 지문을 통해 실용적인 정보를 습득하고, 글의 중심 생각을 한 문장으로 요약하는 기초적인 능력을 갖추고 있습니다.'
    }
  ],
  'TOEFL JR.': [
    {
      minScore: 0,
      maxScore: 10,
      level: '중학교 1학년 수준',
      achievement: '글 속에서 구체적인 정보(누가, 언제, 어디서 등)를 정확하게 찾아내는 능력이 우수합니다. 생활 밀착형 지문을 통해 실용적인 정보를 습득하고, 글의 중심 생각을 한 문장으로 요약하는 기초적인 능력을 갖추고 있습니다.'
    },
    {
      minScore: 11,
      maxScore: 15,
      level: '중학교 2학년 수준',
      achievement: '단순한 사실 확인을 넘어 글의 전체적인 흐름을 논리적으로 따라가기 시작합니다. 앞뒤 문맥을 통해 생소한 어휘의 뜻을 짐작해 보며, 글쓴이가 전달하고자 하는 핵심 메시지를 파악하는 눈이 생겼습니다.'
    },
    {
      minScore: 16,
      maxScore: 20,
      level: '중학교 3학년 수준',
      achievement: '역사, 과학 등 다양한 주제의 논픽션 지문을 소화하며 배경지식을 독해에 활용하기 시작합니다. 글의 세부 내용 간의 연결 고리를 이해하고, 긴 지문에서도 집중력을 잃지 않고 끝까지 읽어내는 인내심을 갖춘 상태입니다.'
    },
    {
      minScore: 21,
      maxScore: 25,
      level: '고등학교 1학년 수준',
      achievement: '수능형 지문의 전형적인 구조를 파악하며 전략적으로 읽는 능력이 형성되었습니다. 글의 서론을 통해 이어질 내용을 예측하고, 필자의 태도나 글의 분위기를 예리하게 포착하여 지문의 목적을 정확히 이해합니다.'
    },
    {
      minScore: 26,
      maxScore: 30,
      level: '고등학교 2학년 수준',
      achievement: '추상적이고 복잡한 개념이 담긴 지문도 자신만의 언어로 재구성하여 이해하는 능력이 탁월합니다. 단순히 글을 읽는 것을 넘어 글 속에 숨겨진 의도나 함축적인 의미를 추론해내는 고차원적인 독해력을 보여줍니다.'
    },
    {
      minScore: 31,
      level: '수능 완성 수준 (고3 및 최상위)',
      achievement: '철학이나 고도의 학술적 지문도 논리적으로 완벽히 장악하는 단계입니다. 낯설고 어려운 소재를 만나도 당황하지 않고 지문의 논리 구조를 분석하여 최선의 답을 도출해내는 숙련된 문해력을 갖추고 있습니다.'
    }
  ],
  'TOEFL': [],
  '독해 Lv.1': [],
  '독해 Lv.2': [],
  '독해 Lv.3': [],
  '독해 Lv.4': []
};

export const GRAMMAR_TEST_TYPES = [
  '초등 문법', '중 1 문법', '중 2 문법', '중 3 문법', '고등 문법'
];

export const ALL_TEST_TYPES = [
  'EPT', 'TOEFL JR.', 'TOEFL', 
  '독해 Lv.1', '독해 Lv.2', '독해 Lv.3', '독해 Lv.4',
  ...GRAMMAR_TEST_TYPES
];

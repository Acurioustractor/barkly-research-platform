export default class OpenAI {
    chat = {
        completions: {
            create: jest.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                successPatterns: [
                                    {
                                        pattern: "Test Pattern",
                                        category: "youth_development",
                                        replicability: 0.9,
                                        sustainability: 0.8
                                    }
                                ],
                                templates: [
                                    { id: "t1", name: "Template 1" }
                                ],
                                sharedPatterns: [],
                                feasibility: 0.8,
                                adaptations: ['Adaptation 1'],
                                timeline: '3 months'
                            })
                        }
                    }
                ]
            })
        }
    };

    constructor(apiKey: any) { }
}

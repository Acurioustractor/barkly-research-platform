export default class Anthropic {
    messages = {
        create: jest.fn().mockResolvedValue({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
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
                        feasibility: 0.8,
                        adaptations: ['Adaptation 1']
                    })
                }
            ]
        })
    };

    constructor(apiKey: any) { }
}

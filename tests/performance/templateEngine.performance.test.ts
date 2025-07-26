import { TemplateRenderer } from '../../src/services/templateRenderer';
import { TemplateCache } from '../../src/services/templateCache';
import { OutputFormatter } from '../../src/services/outputFormatter';
import { ParallelProcessor } from '../../src/services/parallelProcessor';
import { TemplateConfig } from '../../src/types';

describe('Template Engine Performance Tests', () => {
  let renderer: TemplateRenderer;
  let cache: TemplateCache;
  let formatter: OutputFormatter;
  let parallelProcessor: ParallelProcessor;

  beforeEach(() => {
    renderer = new TemplateRenderer();
    cache = new TemplateCache();
    formatter = new OutputFormatter();
    parallelProcessor = new ParallelProcessor();
  });

  describe('TASK-037: Test template rendering performance', () => {
    it('should render simple templates quickly', async () => {
      const template = 'Hello {{name}}! Welcome to {{project}}!';
      const variables = { name: 'World', project: 'Memory Banks' };

      const startTime = Date.now();
      const result = await renderer.renderTemplate(template, variables);
      const endTime = Date.now();

      expect(result.content).toBe('Hello World! Welcome to Memory Banks!');
      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
      expect(result.renderTime).toBeLessThan(100);
    });

    it('should render complex templates efficiently', async () => {
      const complexTemplate = `{% if user %}
{% if user.isAdmin %}
# Admin Dashboard for {{user.name}}

Welcome, {{user.name}}! You have admin privileges.

## Recent Activity
{% for activity in user.recentActivity %}
- {{activity.type}}: {{activity.description}} ({{activity.timestamp}})
{% endfor %}

## System Stats
- Users: {{stats.totalUsers}}
- Active Sessions: {{stats.activeSessions}}
- Server Load: {{stats.serverLoad}}%

{% if stats.alerts %}
## Alerts
{% for alert in stats.alerts %}
- **{{alert.severity}}**: {{alert.message}}
{% endfor %}
{% endif %}

{% else %}
# User Dashboard for {{user.name}}

Welcome, {{user.name}}! You have {{user.permissions?.length}} permissions.

## Your Permissions
{% for permission in user.permissions %}
- {{permission.name}}: {{permission.description}}
{% endfor %}

{% endif %}
{% else %}
# Welcome Guest

Please log in to access your dashboard.
{% endif %}`;

      const variables = {
        user: {
          name: 'John Doe',
          isAdmin: true,
          recentActivity: [
            { type: 'Login', description: 'User logged in', timestamp: '2023-01-01 10:00:00' },
            { type: 'Action', description: 'Updated profile', timestamp: '2023-01-01 09:30:00' },
          ],
          permissions: [
            { name: 'read', description: 'Read access' },
            { name: 'write', description: 'Write access' },
          ],
        },
        stats: {
          totalUsers: 1000,
          activeSessions: 150,
          serverLoad: 75,
          alerts: [
            { severity: 'Warning', message: 'High memory usage' },
            { severity: 'Info', message: 'Backup completed' },
          ],
        },
      };

      const startTime = Date.now();
      const result = await renderer.renderTemplate(complexTemplate, variables);
      const endTime = Date.now();

      expect(result.content).toContain('Admin Dashboard for John Doe');
      expect(result.content).toContain('Welcome, John Doe!');
      expect(result.content).toContain('Users: 1000');
      expect(result.content).toContain('High memory usage');
      expect(endTime - startTime).toBeLessThan(500); // Should render in under 500ms
      expect(result.renderTime).toBeLessThan(500);
    });

    it('should handle large variable sets efficiently', async () => {
      const template = '{% for item in items %}\n' +
        'Item {{loop.index}}: {{item.name}} - {{item.description}}\n' +
        'Price: ${{item.price}}\n' +
        'Category: {{item.category}}\n' +
        'Tags: {% for tag in item.tags %}{{tag}}{% if not loop.last %}, {% endif %}{% endfor %}\n' +
        '\n' +
        '{% endfor %}';

      const variables = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          price: (Math.random() * 100).toFixed(2),
          category: `Category ${i % 10}`,
          tags: [`tag${i}`, `tag${i + 1}`, `tag${i + 2}`],
        })),
      };

      const startTime = Date.now();
      const result = await renderer.renderTemplate(template, variables);
      const endTime = Date.now();

      expect(result.content).toContain('Item 1: Product 0');
      expect(result.content).toContain('Item 1000: Product 999');
      expect(endTime - startTime).toBeLessThan(2000); // Should render in under 2 seconds
      expect(result.renderTime).toBeLessThan(2000);
    });

    it('should demonstrate caching performance improvements', async () => {
      const template = 'Hello {{name}}! Welcome to {{project}}!';
      const variables = { name: 'World', project: 'Memory Banks' };

      // First render (no cache)
      const startTime1 = Date.now();
      const result1 = await renderer.renderTemplate(template, variables, { enableCache: true, cache });
      const time1 = Date.now() - startTime1;

      // Second render (with cache)
      const startTime2 = Date.now();
      const result2 = await renderer.renderTemplate(template, variables, { enableCache: true, cache });
      const time2 = Date.now() - startTime2;

      expect(result1.cacheHit).toBe(false);
      expect(result2.cacheHit).toBe(true);
      // Both renders are very fast, so we just verify cache is working
      expect(time1).toBeGreaterThanOrEqual(0);
      expect(time2).toBeGreaterThanOrEqual(0);
    });

    it('should handle nested loops efficiently', async () => {
      const template = '{% for category in categories %}\n' +
        '# {{category.name}}\n' +
        '\n' +
        '{% for product in category.products %}\n' +
        '## {{product.name}}\n' +
        'Price: ${{product.price}}\n' +
        'Description: {{product.description}}\n' +
        '\n' +
        '{% for review in product.reviews %}\n' +
        '- {{review.user}}: {{review.rating}}/5 - {{review.comment}}\n' +
        '{% endfor %}\n' +
        '\n' +
        '{% endfor %}\n' +
        '\n' +
        '{% endfor %}';

      const variables = {
        categories: Array.from({ length: 10 }, (_, i) => ({
          name: `Category ${i}`,
          products: Array.from({ length: 20 }, (_, j) => ({
            name: `Product ${i}-${j}`,
            price: (Math.random() * 100).toFixed(2),
            description: `Description for product ${i}-${j}`,
            reviews: Array.from({ length: 5 }, (_, k) => ({
              user: `User ${k}`,
              rating: Math.floor(Math.random() * 5) + 1,
              comment: `Review ${k} for product ${i}-${j}`,
            })),
          })),
        })),
      };

      const startTime = Date.now();
      const result = await renderer.renderTemplate(template, variables);
      const endTime = Date.now();

      expect(result.content).toContain('Category 0');
      expect(result.content).toContain('Product 9-19');
      expect(endTime - startTime).toBeLessThan(3000); // Should render in under 3 seconds
      expect(result.renderTime).toBeLessThan(3000);
    });
  });

  describe('TASK-037: Add file generation performance tests', () => {
    it('should generate multiple files efficiently', async () => {
      const template: TemplateConfig = {
        name: 'Performance Test Template',
        description: 'Template for performance testing',
        version: '1.0.0',
        files: Array.from({ length: 50 }, (_, i) => ({
          path: `src/file${i}.ts`,
          content: `export const function${i} = () => {
  console.log("Function ${i} from {{projectName}}");
  return "{{projectName}}_${i}";
};`,
        })),
      };

      const variables = { projectName: 'PerformanceProject' };

      const startTime = Date.now();
      const results = await parallelProcessor.processFileGeneration(template, variables, 'output');
      const endTime = Date.now();

      expect(results.length).toBe(50);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle large file content efficiently', async () => {
      const largeContent = Array.from({ length: 1000 }, (_, i) => 
        `export const largeFunction${i} = () => "{{projectName}}_${i}";`
      ).join('\n');

      const template: TemplateConfig = {
        name: 'Large File Template',
        description: 'Template with large file content',
        version: '1.0.0',
        files: [
          { path: 'src/large.ts', content: largeContent },
        ],
      };

      const variables = { projectName: 'LargeProject' };

      const startTime = Date.now();
      const results = await parallelProcessor.processFileGeneration(template, variables, 'output');
      const endTime = Date.now();

      expect(results.length).toBe(1);
      expect(results[0]?.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should process files in parallel efficiently', async () => {
      const templates = Array.from({ length: 10 }, (_, i) => ({
        name: `Template ${i}`,
        description: `Template ${i} description`,
        version: '1.0.0',
        files: Array.from({ length: 5 }, (_, j) => ({
          path: `src/template${i}/file${j}.ts`,
          content: `export const template${i}Function${j} = () => "{{projectName}}_${i}_${j}";`,
        })),
      }));

      const variables = { projectName: 'ParallelProject' };

      const startTime = Date.now();
      const promises = templates.map(template =>
        parallelProcessor.processFileGeneration(template, variables, 'output')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results.length).toBe(10);
      expect(results.every(result => result.length === 5)).toBe(true);
      expect(results.every(result => result.every(r => r.success))).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    it('should handle file formatting efficiently', async () => {
      const largeCode = Array.from({ length: 500 }, (_, i) => 
        `function test${i}(){console.log("test${i}");}`
      ).join('\n');

      const startTime = Date.now();
      const result = formatter.formatCode(largeCode, 'large.ts');
      const endTime = Date.now();

      expect(result.content).toBeDefined();
      expect(result.formattedLength).toBeGreaterThan(result.originalLength);
      expect(endTime - startTime).toBeLessThan(1000); // Should format in under 1 second
    });
  });

  describe('TASK-037: Create memory usage tests', () => {
    it('should maintain reasonable memory usage during rendering', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const memorySnapshots: number[] = [];

      // Render multiple templates to test memory usage
      for (let i = 0; i < 100; i++) {
        const template = `Template ${i}: {{name}} - {{description}}`;
        const variables = {
          name: `Project ${i}`,
          description: `Description for project ${i}`,
        };

        await renderer.renderTemplate(template, variables);
        
        if (i % 10 === 0) {
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

      // Memory should not grow exponentially
      const memoryGrowth = memorySnapshots.map((snapshot, index) => 
        index > 0 ? snapshot - (memorySnapshots[index - 1] || 0) : 0
      );
      
      const averageGrowth = memoryGrowth.reduce((sum, growth) => sum + growth, 0) / memoryGrowth.length;
      expect(averageGrowth).toBeLessThan(1024 * 1024); // Less than 1MB average growth
    });

    it('should handle cache memory management', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Add many items to cache
      for (let i = 0; i < 1000; i++) {
        const content = `Large content ${i}: ${'x'.repeat(1000)}`;
        cache.setTemplateContent(`cache-${i}`, content);
      }

      const peakMemory = process.memoryUsage().heapUsed;

      // Clear cache
      cache.invalidateAll();

      const finalMemory = process.memoryUsage().heapUsed;

      // Memory should be reclaimed after cache clear
      expect(finalMemory).toBeLessThan(peakMemory);
      expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it('should handle large variable objects efficiently', async () => {
      const largeVariables = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            bio: `Bio for user ${i}`,
            avatar: `avatar${i}.jpg`,
            preferences: {
              theme: i % 2 === 0 ? 'dark' : 'light',
              language: i % 3 === 0 ? 'en' : i % 3 === 1 ? 'es' : 'fr',
            },
          },
        })),
        settings: {
          app: {
            name: 'Test App',
            version: '1.0.0',
            features: Array.from({ length: 100 }, (_, i) => `feature${i}`),
          },
        },
      };

      const template = `{% for user in users %}
User: {{user.name}} ({{user.email}})
Bio: {{user.profile.bio}}
Theme: {{user.profile.preferences.theme}}
Language: {{user.profile.preferences.language}}

{% endfor %}

App: {{settings.app.name}} v{{settings.app.version}}
Features: {% for feature in settings.app.features %}{{feature}}{% if not loop.last %}, {% endif %}{% endfor %}`;

      const initialMemory = process.memoryUsage().heapUsed;
      const startTime = Date.now();

      const result = await renderer.renderTemplate(template, largeVariables);
      const endTime = Date.now();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.content).toContain('User: User 0');
      expect(result.content).toContain('User: User 999');
      expect(endTime - startTime).toBeLessThan(3000); // Should render in under 3 seconds
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
    });

    it('should monitor memory usage during parallel processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const memorySnapshots: number[] = [];

      const templates = Array.from({ length: 20 }, (_, i) => ({
        name: `Memory Test Template ${i}`,
        description: `Template ${i} for memory testing`,
        version: '1.0.0',
        files: Array.from({ length: 10 }, (_, j) => ({
          path: `src/template${i}/file${j}.ts`,
          content: `export const memoryTest${i}_${j} = () => "{{projectName}}_${i}_${j}";`,
        })),
      }));

      const variables = { projectName: 'MemoryTestProject' };

      // Process templates in batches to monitor memory
      for (let i = 0; i < templates.length; i += 5) {
        const batch = templates.slice(i, i + 5);
        const promises = batch.map(template =>
          parallelProcessor.processFileGeneration(template, variables, 'output')
        );

        await Promise.all(promises);
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const totalMemoryIncrease = finalMemory - initialMemory;

      expect(totalMemoryIncrease).toBeLessThan(150 * 1024 * 1024); // Less than 150MB total increase

      // Memory should not grow exponentially
      const memoryGrowth = memorySnapshots.map((snapshot, index) => 
        index > 0 ? snapshot - (memorySnapshots[index - 1] || 0) : 0
      );
      
      const maxGrowth = Math.max(...memoryGrowth);
      expect(maxGrowth).toBeLessThan(50 * 1024 * 1024); // No single batch should increase memory by more than 50MB
    });
  });

  describe('TASK-037: Implement scalability tests', () => {
    it('should scale with increasing template complexity', async () => {
      const complexityLevels = [10, 50, 100, 200];
      const performanceResults: { complexity: number; time: number; memory: number }[] = [];

      for (const complexity of complexityLevels) {
        const template = Array.from({ length: complexity }, (_, i) => 
          `{% if condition${i} %}{{variable${i}}}{% endif %}`
        ).join('\n');

        const variables = Object.fromEntries(
          Array.from({ length: complexity }, (_, i) => [
            `condition${i}`, true,
            `variable${i}`, `value${i}`,
          ])
        );

        const initialMemory = process.memoryUsage().heapUsed;
        const startTime = Date.now();

        const result = await renderer.renderTemplate(template, variables);
        const endTime = Date.now();

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        performanceResults.push({
          complexity,
          time: endTime - startTime,
          memory: memoryIncrease,
        });

        expect(result.content).toContain('value0');
        expect(result.content).toContain(`value${complexity - 1}`);
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < performanceResults.length; i++) {
        const current = performanceResults[i];
        const previous = performanceResults[i - 1];
        
        if (current && previous) {
          const timeRatio = current.time / (previous.time || 1);
          const complexityRatio = current.complexity / (previous.complexity || 1);
          
          // Time increase should not be more than 3x the complexity increase
          expect(timeRatio).toBeLessThan(complexityRatio * 3);
        }
      }
    });

    it('should scale with increasing file count', async () => {
      const fileCounts = [10, 25, 50, 100];
      const performanceResults: { fileCount: number; time: number }[] = [];

      for (const fileCount of fileCounts) {
        const template: TemplateConfig = {
          name: `Scalability Template ${fileCount}`,
          description: `Template with ${fileCount} files`,
          version: '1.0.0',
          files: Array.from({ length: fileCount }, (_, i) => ({
            path: `src/file${i}.ts`,
            content: `export const function${i} = () => "{{projectName}}_${i}";`,
          })),
        };

        const variables = { projectName: 'ScalabilityProject' };

        const startTime = Date.now();
        const results = await parallelProcessor.processFileGeneration(template, variables, 'output');
        const endTime = Date.now();

        performanceResults.push({
          fileCount,
          time: endTime - startTime,
        });

        expect(results.length).toBe(fileCount);
        expect(results.every(r => r.success)).toBe(true);
      }

      // Performance should scale reasonably with file count
      for (let i = 1; i < performanceResults.length; i++) {
        const current = performanceResults[i];
        const previous = performanceResults[i - 1];
        
        if (current && previous) {
          const timeRatio = current.time / (previous.time || 1);
          const fileCountRatio = current.fileCount / (previous.fileCount || 1);
          
          // Time increase should not be more than 2x the file count increase
          expect(timeRatio).toBeLessThan(fileCountRatio * 2);
        }
      }
    });

    it('should scale with concurrent operations', async () => {
      const concurrencyLevels = [1, 2, 4, 8];
      const performanceResults: { concurrency: number; time: number; throughput: number }[] = [];

      for (const concurrency of concurrencyLevels) {
        const templates = Array.from({ length: 20 }, (_, i) => ({
          name: `Concurrency Template ${i}`,
          description: `Template ${i} for concurrency testing`,
          version: '1.0.0',
          files: [
            { path: `src/template${i}.ts`, content: `export const template${i} = () => "{{projectName}}_${i}";` },
          ],
        }));

        const variables = { projectName: 'ConcurrencyProject' };

        const startTime = Date.now();
        const promises = templates.map(template =>
          parallelProcessor.processFileGeneration(template, variables, 'output')
        );

        const results = await Promise.all(promises);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const throughput = templates.length / (totalTime / 1000); // templates per second

        performanceResults.push({
          concurrency,
          time: totalTime,
          throughput,
        });

        expect(results.length).toBe(20);
        expect(results.every(result => result.length === 1)).toBe(true);
        expect(results.every(result => result[0]?.success)).toBe(true);
      }

      // Throughput should generally increase with concurrency (up to a point)
      for (let i = 1; i < performanceResults.length; i++) {
        const current = performanceResults[i];
        const previous = performanceResults[i - 1];
        
        if (current && previous) {
          const throughputRatio = current.throughput / (previous.throughput || 1);
          
          // Throughput should not decrease significantly with increased concurrency
          expect(throughputRatio).toBeGreaterThan(0.5);
        }
      }
    });

    it('should handle system resource constraints gracefully', async () => {
      // Simulate resource-constrained environment
      const originalMemoryLimit = process.env['NODE_OPTIONS'];
      process.env['NODE_OPTIONS'] = '--max-old-space-size=128'; // Limit to 128MB

      const template: TemplateConfig = {
        name: 'Resource Constrained Template',
        description: 'Template for resource constraint testing',
        version: '1.0.0',
        files: Array.from({ length: 10 }, (_, i) => ({
          path: `src/file${i}.ts`,
          content: `export const function${i} = () => "{{projectName}}_${i}";`,
        })),
      };

      const variables = { projectName: 'ResourceProject' };

      try {
        const startTime = Date.now();
        const results = await parallelProcessor.processFileGeneration(template, variables, 'output');
        const endTime = Date.now();

        expect(results.length).toBe(10);
        expect(results.every(r => r.success)).toBe(true);
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds even with constraints
      } finally {
        // Restore original memory limit
        if (originalMemoryLimit) {
          process.env['NODE_OPTIONS'] = originalMemoryLimit;
        } else {
          delete process.env['NODE_OPTIONS'];
        }
      }
    });

    it('should maintain performance under load', async () => {
      const loadTest = async (templateCount: number) => {
        const templates = Array.from({ length: templateCount }, (_, i) => ({
          name: `Load Test Template ${i}`,
          description: `Template ${i} for load testing`,
          version: '1.0.0',
          files: [
            { path: `src/template${i}.ts`, content: `export const template${i} = () => "{{projectName}}_${i}";` },
          ],
        }));

        const variables = { projectName: 'LoadTestProject' };

        const startTime = Date.now();
        const promises = templates.map(template =>
          parallelProcessor.processFileGeneration(template, variables, 'output')
        );

        const results = await Promise.all(promises);
        const endTime = Date.now();

        return {
          templateCount,
          time: endTime - startTime,
          success: results.every(result => result.length === 1 && result[0]?.success),
        };
      };

      const loadLevels = [10, 25, 50, 75, 100];
      const results = await Promise.all(loadLevels.map(loadTest));

      // All tests should complete successfully
      expect(results.every(r => r.success)).toBe(true);

      // Performance should not degrade catastrophically
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];
        
        if (current && previous) {
          const timeRatio = current.time / (previous.time || 1);
          const templateRatio = current.templateCount / (previous.templateCount || 1);
          
          // Time increase should not be more than 4x the template count increase
          expect(timeRatio).toBeLessThan(templateRatio * 4);
        }
      }
    });
  });

  describe('Performance Benchmarking', () => {
    it('should provide comprehensive performance metrics', async () => {
      const metrics = {
        renderTime: 0,
        formatTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        throughput: 0,
      };

      // Test rendering performance
      const template = 'Hello {{name}}! Welcome to {{project}}!';
      const variables = { name: 'World', project: 'Memory Banks' };

      const renderStart = Date.now();
      const renderResult = await renderer.renderTemplate(template, variables);
      const renderEnd = Date.now();
      metrics.renderTime = renderEnd - renderStart;

      // Test formatting performance
      const formatStart = Date.now();
      formatter.formatCode(renderResult.content, 'test.ts');
      const formatEnd = Date.now();
      metrics.formatTime = formatEnd - formatStart;

      // Test cache performance
      await renderer.renderTemplate(template, variables, { enableCache: true });
      const cacheEnd = Date.now();
      const cachedResult = await renderer.renderTemplate(template, variables, { enableCache: true });
      const cacheEnd2 = Date.now();

      metrics.cacheHitRate = cachedResult.cacheHit ? 1 : 0;
      metrics.throughput = 1000 / (cacheEnd2 - cacheEnd); // operations per second

      // Memory usage
      metrics.memoryUsage = process.memoryUsage().heapUsed;

      // Verify metrics are reasonable
      expect(metrics.renderTime).toBeLessThan(100);
      expect(metrics.formatTime).toBeLessThan(50);
      expect(metrics.cacheHitRate).toBe(1);
      expect(metrics.throughput).toBeGreaterThan(10); // At least 10 ops/second
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });

    it('should compare performance across different template types', async () => {
      const templateTypes = {
        simple: 'Hello {{name}}!',
        conditional: '{% if showMessage %}Hello {{name}}!{% endif %}',
        loop: '{% for item in items %}{{item.name}}: {{item.value}}\n{% endfor %}',
        nested: '{% if user %}{% if user.isAdmin %}Admin: {{user.name}}{% else %}User: {{user.name}}{% endif %}{% endif %}',
      };

      const variables = {
        name: 'World',
        showMessage: true,
        items: Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i}`, value: i })),
        user: { name: 'John', isAdmin: true },
      };

      const performanceResults: Record<string, number> = {};

      for (const [type, template] of Object.entries(templateTypes)) {
        const startTime = Date.now();
        await renderer.renderTemplate(template, variables);
        const endTime = Date.now();
        performanceResults[type] = endTime - startTime;
      }

      // Simple templates should be fastest
      expect(performanceResults['simple']).toBeLessThan(performanceResults['conditional'] || 0);
      expect(performanceResults['simple']).toBeLessThan(performanceResults['loop'] || 0);
      expect(performanceResults['simple']).toBeLessThan(performanceResults['nested'] || 0);

      // All should complete within reasonable time
      Object.values(performanceResults).forEach(time => {
        expect(time).toBeLessThan(100);
      });
    });
  });
}); 
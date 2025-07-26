# Java Spring Boot Development Guide

## Project Overview
This guide provides best practices and standards for developing Java Spring Boot applications. It covers code style, architecture patterns, testing strategies, and deployment considerations.

## Code Style & Standards

### Java Conventions
- Follow Java naming conventions:
  - `camelCase` for variables and methods
  - `PascalCase` for classes and interfaces
  - `UPPER_SNAKE_CASE` for constants
  - `lowercase` for packages
- Use meaningful, descriptive names for variables, methods, and classes
- Keep methods focused and single-purpose (Single Responsibility Principle)
- Use proper indentation (4 spaces, not tabs)
- Limit method length to 20-30 lines when possible
- Limit class length to 300-500 lines when possible

### Documentation
- Add JavaDoc comments for public methods and classes
- Include `@param`, `@return`, and `@throws` tags where appropriate
- Write clear, concise comments for complex business logic
- Document design decisions and architectural choices
- Keep README.md updated with setup and usage instructions

### Code Organization
- Group related methods together
- Order methods: constructors, public methods, protected methods, private methods
- Use consistent import ordering
- Remove unused imports and variables
- Follow the principle of least privilege (private by default)

## Architecture Guidelines

### Spring Boot Best Practices
- Use appropriate Spring Boot annotations:
  - `@SpringBootApplication` for main application class
  - `@Component`, `@Service`, `@Repository`, `@Controller` for dependency injection
  - `@Configuration` for configuration classes
  - `@Value` for externalized configuration
- Implement layered architecture:
  - **Controller Layer**: Handle HTTP requests/responses
  - **Service Layer**: Business logic and orchestration
  - **Repository Layer**: Data access and persistence
  - **Model Layer**: Data structures and entities
- Use dependency injection for loose coupling
- Implement interfaces for better testability

### Design Patterns
- **Singleton**: Use Spring's singleton scope (default)
- **Factory**: Use `@Bean` methods in configuration classes
- **Strategy**: Use interfaces for interchangeable algorithms
- **Observer**: Use Spring events for decoupled communication
- **Builder**: For complex object construction
- **Repository**: For data access abstraction

### Error Handling
- Use `@ControllerAdvice` for global exception handling
- Create custom exception classes for business logic errors
- Return appropriate HTTP status codes
- Log errors with sufficient context
- Don't expose sensitive information in error messages

## File Organization

### Standard Directory Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/company/project/
│   │       ├── Application.java
│   │       ├── config/
│   │       ├── controller/
│   │       ├── service/
│   │       ├── repository/
│   │       ├── model/
│   │       ├── dto/
│   │       ├── exception/
│   │       └── util/
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-prod.yml
│       ├── static/
│       └── templates/
└── test/
    └── java/
        └── com/company/project/
            ├── controller/
            ├── service/
            ├── repository/
            └── integration/
```

### Package Naming
- Use reverse domain notation: `com.company.project`
- Group by functionality, not by layer
- Keep package names short and meaningful
- Avoid deep nesting (max 4-5 levels)

## Build & Run

### Maven Configuration
- Use Maven wrapper (`mvnw`) for consistent builds
- Define proper project coordinates in `pom.xml`
- Use dependency management for version control
- Configure appropriate plugins for testing, packaging, and deployment

### Common Commands
```bash
# Build project
./mvnw clean install

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Package application
./mvnw package

# Run with specific profile
./mvnw spring-boot:run -Dspring.profiles.active=dev
```

### Environment Configuration
- Use `application.yml` for main configuration
- Create profile-specific files: `application-dev.yml`, `application-prod.yml`
- Externalize sensitive configuration (passwords, API keys)
- Use environment variables for deployment-specific settings

## Testing Strategy

### Test Types
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test under load and stress

### Testing Best Practices
- Use JUnit 5 for unit testing
- Use Mockito for mocking dependencies
- Use `@SpringBootTest` for integration tests
- Use `@WebMvcTest` for controller tests
- Use `@DataJpaTest` for repository tests
- Aim for 80%+ code coverage
- Test both happy path and edge cases
- Use descriptive test method names

### Test Organization
```
src/test/java/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── performance/   # Performance tests
```

## Dependencies & Security

### Dependency Management
- Use Spring Boot starter dependencies when possible
- Keep dependencies up to date
- Regularly scan for security vulnerabilities
- Use dependency management for version control
- Document why each dependency is needed

### Security Best Practices
- Use Spring Security for authentication and authorization
- Implement proper input validation
- Use HTTPS in production
- Sanitize user inputs
- Implement rate limiting
- Use secure session management
- Follow OWASP guidelines

## Performance Considerations

### Application Performance
- Use connection pooling for databases
- Implement caching where appropriate
- Optimize database queries
- Use async processing for long-running tasks
- Monitor memory usage and garbage collection
- Profile application under load

### Monitoring & Observability
- Implement health checks (`/actuator/health`)
- Add metrics collection
- Use structured logging
- Implement distributed tracing
- Monitor application performance
- Set up alerting for critical issues

## Deployment & DevOps

### Containerization
- Use Docker for consistent environments
- Create multi-stage Dockerfiles
- Optimize image size
- Use `.dockerignore` to exclude unnecessary files

### CI/CD Pipeline
- Automate build, test, and deployment
- Use feature branches and pull requests
- Implement automated testing
- Use semantic versioning
- Deploy to staging before production

### Environment Management
- Use different configurations for different environments
- Externalize configuration
- Use secrets management for sensitive data
- Implement blue-green deployments
- Use health checks for deployment validation

## Code Quality

### Static Analysis
- Use SonarQube or similar tools
- Configure code quality gates
- Address code smells and technical debt
- Maintain consistent code formatting
- Use IDE code style settings

### Code Review
- Review all code changes
- Use pull request templates
- Check for security vulnerabilities
- Verify test coverage
- Ensure documentation is updated

## Best Practices Summary

1. **Keep it Simple**: Prefer simple solutions over complex ones
2. **Fail Fast**: Validate inputs early and fail with clear messages
3. **Be Explicit**: Make code intentions clear through naming and structure
4. **Test Everything**: Write tests for all business logic
5. **Document Decisions**: Record architectural and design decisions
6. **Security First**: Consider security implications of all changes
7. **Performance Matters**: Design with performance in mind
8. **Maintainability**: Write code that's easy to understand and modify
9. **Consistency**: Follow established patterns and conventions
10. **Continuous Improvement**: Regularly refactor and improve code quality 
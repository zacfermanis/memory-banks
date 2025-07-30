# Custom Development Guides Feature Requirements

## Overview
This feature allows users to extend the memory-bank library with their own custom development guides and associated menu options. Users can add proprietary instructions and company-specific development practices for easy reuse across projects.

## User Stories

### Core Functionality

**US-001: Custom Development Guide Discovery**
- **AS A** developer using memory-bank
- **I WANT** the tool to automatically discover custom development guides in a configurable folder
- **SO THAT** I can easily add my own development practices without modifying the core library

**Acceptance Criteria:**
- WHEN the memory-bank tool starts
- THEN it SHALL scan a configurable default folder for custom development guides
- AND it SHALL treat each subfolder as a separate menu option
- AND it SHALL copy the development guide from each subfolder to the project's .memory-bank directory

**US-002: Custom Menu Integration**
- **AS A** developer using memory-bank
- **I WANT** custom development guides to appear as menu options alongside built-in guides
- **SO THAT** I can choose between standard and custom development practices

**Acceptance Criteria:**
- WHEN the memory-bank tool displays available options
- THEN it SHALL show built-in development guides (Lua, Web, Java)
- AND it SHALL show custom development guides discovered in the configured folder
- AND it SHALL display custom guides with clear, user-friendly names

**US-003: Development Guide Copying**
- **AS A** developer using memory-bank
- **I WANT** the selected custom development guide to be copied to my project
- **SO THAT** I can use my company's proprietary development practices

**Acceptance Criteria:**
- WHEN a user selects a custom development guide
- THEN the tool SHALL copy the developmentGuide.md file from the selected subfolder
- AND it SHALL copy any associated .cursorrules file if present
- AND it SHALL maintain the same file structure as built-in guides

### Configuration Management

**US-004: Default Folder Configuration**
- **AS A** developer using memory-bank
- **I WANT** to configure the default folder where custom development guides are stored
- **SO THAT** I can organize my guides in a location that makes sense for my workflow

**Acceptance Criteria:**
- WHEN the user runs the configuration command
- THEN the tool SHALL allow setting a custom default folder path
- AND it SHALL persist this configuration for future use
- AND it SHALL provide a way to reset to the system default

**US-005: Custom Menu Item Configuration**
- **AS A** developer using memory-bank
- **I WANT** to configure the display names and organization of custom menu items
- **SO THAT** I can present my guides with meaningful names and logical grouping

**Acceptance Criteria:**
- WHEN the user runs the configuration command
- THEN the tool SHALL allow customizing the display name for each guide
- AND it SHALL allow organizing guides into categories or groups
- AND it SHALL persist these customizations for future use

### CLI Commands

**US-006: Configuration Command**
- **AS A** developer using memory-bank
- **I WANT** a separate npx script to configure custom development guides
- **SO THAT** I can set up my custom guides without affecting the main initialization process

**Acceptance Criteria:**
- WHEN the user runs `npx @zacfermanis/memory-bank configure`
- THEN the tool SHALL provide an interactive configuration interface
- AND it SHALL allow setting the default custom guides folder
- AND it SHALL allow customizing menu item names and organization
- AND it SHALL save configuration to a persistent location

**US-007: Configuration Validation**
- **AS A** developer using memory-bank
- **I WANT** the configuration tool to validate my settings
- **SO THAT** I can ensure my custom guides will work correctly

**Acceptance Criteria:**
- WHEN the user configures custom development guides
- THEN the tool SHALL validate that the specified folder exists
- AND it SHALL validate that subfolders contain required files (developmentGuide.md)
- AND it SHALL provide clear error messages for invalid configurations

### File Structure Requirements

**US-008: Custom Guide File Structure**
- **AS A** developer creating custom development guides
- **I WANT** a clear file structure for organizing my guides
- **SO THAT** I can easily add and maintain my custom development practices

**Acceptance Criteria:**
- WHEN a custom development guide folder is created
- THEN it SHALL contain a developmentGuide.md file
- AND it MAY contain a .cursorrules file
- AND it SHALL use the folder name as the default menu option name
- AND it SHALL support nested organization (categories/subcategories)

### Error Handling

**US-009: Graceful Error Handling**
- **AS A** developer using memory-bank
- **I WANT** the tool to handle missing or invalid custom guides gracefully
- **SO THAT** the tool continues to work even if custom guides are misconfigured

**Acceptance Criteria:**
- WHEN custom guides are missing or invalid
- THEN the tool SHALL continue to function with built-in guides only
- AND it SHALL provide clear warning messages about invalid custom guides
- AND it SHALL not crash or exit unexpectedly

**US-010: Configuration Recovery**
- **AS A** developer using memory-bank
- **I WANT** to be able to recover from configuration errors
- **SO THAT** I can fix issues and continue using the tool

**Acceptance Criteria:**
- WHEN configuration errors occur
- THEN the tool SHALL provide clear instructions for fixing the issues
- AND it SHALL offer to reset to default configuration if needed
- AND it SHALL maintain a backup of previous working configuration

## Non-Functional Requirements

**NFR-001: Performance**
- The tool SHALL scan custom guides quickly without noticeable delay
- Configuration changes SHALL be applied immediately

**NFR-002: Compatibility**
- Custom guides SHALL work with all existing memory-bank functionality
- The feature SHALL not break existing built-in guides

**NFR-003: Extensibility**
- The system SHALL be designed to easily add more configuration options in the future
- The file structure SHALL support additional file types beyond developmentGuide.md and .cursorrules

**NFR-004: User Experience**
- The configuration interface SHALL be intuitive and user-friendly
- Error messages SHALL be clear and actionable
- The tool SHALL provide helpful feedback during all operations

**NFR-005: Documentation**
- The README documentation SHALL contain clear instructions on how to use this feature
- Documentation SHALL include examples of custom guide file structure
- Documentation SHALL provide step-by-step setup instructions for the configuration command 
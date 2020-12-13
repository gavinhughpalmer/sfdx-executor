FROM salesforce/salesforcedx:latest
RUN echo 'y' | sfdx plugins:install sfdx-executor
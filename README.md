# TaskMAD - Wizard of Oz Interface

## Overview 

This repository provides the codebase required to deploy the Wizard of Oz interface associated with the [TaskMAD Framework](https://github.com/grill-lab/TaskMAD). 

More information on the TaskMAD framework can be found in our paper *[TaskMAD: A Platform for Multimodal Task-Centric Knowledge-Grounded Conversational Experimentation](https://dl.acm.org/doi/10.1145/3477495.3531679)*. 

## Running the WoZ Interface

### Deployment
In order to test the interface locally once cloned, run the following commands: 

```
cd TaskMAD-WoZ-Interface
npm install 
npm start
```
The interface will be deployed locally at the address `http://localhost:3000`.

Moreover, we also provide `Dockerfile` and `yaml` files to quickly deploy the application on GCP or AWS. 

### Using the WoZ Interface 

When the interface is loaded, proceed as follows:

1. From the *Select Connector* dropdown menu select **Agent Dialogue**
2. Then provide the following information:
	* **Server URL:** The TaskMAD core public URL
	* **UserID:** The Wizard name as it will appear in the conversation. 
	* **Conversation ID:** Unique conversation ID to allow the communication between Wizard and User. 
3. Select the *Show chat Transcript* checkbox. 
4. Click on *Upload Excel spreadsheet*
	* This file, provided as an `xlsx` file, defines the WoZ interface, which is generated automatically. For more information regarding its data format, check the official [documentation](https://nld.ict.usc.edu/woz/doc/). [Sample spreadsheet UI data can also be downloaded here.](https://docs.google.com/spreadsheets/d/1xaWdhQboriqFU3YLDqe4GXFPRPaO9QGtYoR9ZKk8oOo)

### Known Issues

A **proto** error might appear when first loading the interface. If that is the case, add `/* eslint-disable */` at the top of this file `src/woz-app/connector/agent-dialogue/generated/client_pb.js`.

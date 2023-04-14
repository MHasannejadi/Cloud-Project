# Cloud-Project
> Microservice project of cloud computing course that has 3 services and provides a code executer platform like Quera.
> You can run every service separately with this commands in their folders: <br />
> First `npm install` then `node index.js`. Note that you must have node.js installed on your system. <br />
> Also you can see project initiation in file initiation.pdf
## Services:

### 1. HTTP Service:
> That provides 3 APIs as follows:
  * Get the programming file with its details and user email from the user and store the file in S3 service and details in uploads table:
    * **URL**
    
      /api/add
    * **Method:**

      `POST`
      
    * **Data Params**

      * file (should be a programming file that CodeX API supports it)
      * language (programming language file format like py, js, cs)
      * inputs (inputs of program if it has input)
      * email
      
  * Get an id to execute it and send it to rabbitMQ service to manage there:
    * **URL**
    
      /api/execute/:id
    * **Method:**

      `GET`
    *  **URL Params**

        **Required:**
 
        `id=[integer]`
        
  * Get an email to return the results of the user files:
    * **URL**
    
      /api/results/:email
    * **Method:**

      `GET`
    *  **URL Params**

        **Required:**
 
        `email=[string]`
        
### 2. Queue(Manager) Service:
> Listens for every id that come from amqp service and stores file details and content in jobs table.

### 3. Executer Service:
> Every few seconds check the job table and send non-executed jobs to CodeX API.

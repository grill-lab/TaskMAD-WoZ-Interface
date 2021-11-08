/*
 * Copyright 2018. University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Struct } from "google-protobuf/google/protobuf/struct_pb"
import { wordsTrim } from "../../common/util"
import { WozConnectors } from "../../woz-app/connector/Connector"
import {ButtonModel, ButtonOrigin} from "../model/ButtonModel"
import {ISearchRequest, ISearchResult, Searcher} from "./Searcher"

export class WikiSearcher extends Searcher {

    constructor() {
        super("Wikipedia Search")
    }

    protected performSearch = async (request: ISearchRequest): Promise<ISearchResult[] | undefined> => {
        let results = [];


        if (request.data === undefined || request.query.trim().length === 0) {
            return undefined
        }

        let apiResponse:Object = await WozConnectors.shared.selectedConnector.onSearchAPIRequest(Struct.fromJavaScript({
            "api_endpoint": "query_documents",
            "request_body": {
                "knowledge_source": "wikipedia",
                "query": request.query.trim()
            }
        }));

        // Check if the response returned something 
        // and check if the response has the proper format 
        if(apiResponse !== undefined && apiResponse.hasOwnProperty('errors') && apiResponse.hasOwnProperty('documents')){
            let errors: string[] = Object.getOwnPropertyDescriptor(apiResponse, 'errors')?.value || [];
            if(errors.length === 0){
                // Get the documents
                let documents:Object[] = Object.getOwnPropertyDescriptor(apiResponse, 'documents')?.value || [];
                
                if(documents.length !== 0){
                    
                    for(let i = 0; i < documents.length;i++){
                        let document = documents[i];
                        
                        results.push({
                            buttonID: new ButtonModel({
                                badges: {},
                                color: "",
                                id: Object.getOwnPropertyDescriptor(document, 'id')?.value || "",
                                label: wordsTrim(Object.getOwnPropertyDescriptor(document, 'contents')?.value || "", 7),
                                tooltip: Object.getOwnPropertyDescriptor(document, 'contents')?.value || "",
                                transitions: {},
                                buttonOrigin: ButtonOrigin.wikipedia,
                                pageId: Object.getOwnPropertyDescriptor(document, 'page_id')?.value || "",
                                paragraphId: Object.getOwnPropertyDescriptor(document, 'hashed_id')?.value || "",
                                pageTitle: Object.getOwnPropertyDescriptor(document, 'page_title')?.value || "",
                                sectionTitle: Object.getOwnPropertyDescriptor(document, 'section_title')?.value || ""
                            })
                        })
                    }
                    
                }

            }

            
           
            
        }
        return results;
    }
}

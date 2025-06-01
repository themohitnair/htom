pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('jenkins-integration')
        NVD_API_KEY = credentials('nvd-api-key')
        PYTHON_VERSION = '3.10'
        ARTIFACT_REGISTRY_REPO = "us-central1-docker.pkg.dev/htom-461604/htom-app-repo/htom-app"
        GCP_PROJECT_ID = "htom-461604"
        GCP_REGION = "us-central1"
        CLOUD_RUN_SERVICE = "htom"
        GCLOUD_CREDENTIALS = 'gcloud-service-account'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out successfully"
            }
        }

        stage('Setup Python Environment') {
            steps {
                sh '''
                    python3 -m venv venv
                    source venv/bin/activate
                    python3 -m pip install --upgrade pip
                    # Install build tools for pyproject.toml
                    pip install build wheel setuptools
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    source venv/bin/activate
                    # Install project in editable mode with all dependencies
                    pip install -e ".[dev]" || pip install -e .
                    # Install testing dependencies if not in pyproject.toml
                    pip install pytest pytest-cov
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    source venv/bin/activate
                    python3 -m pytest tests/ --verbose --cov=. --cov-report=xml --cov-report=html || echo "Tests completed with issues"
                '''
            }
        }

        stage('OWASP Dependency Check') {
            steps {
              dependencyCheck additionalArguments: '''
                  --scan ./
                  --out ./
                  --format ALL
                  --prettyPrint
                  --enableRetired
                  --enableExperimental
                  --data /var/lib/jenkins/dependency-check-data
              ''',
              odcInstallation: 'OWASP-DepCheck',
              nvdCredentialsId: 'nvd-api-key'

              dependencyCheckPublisher pattern: 'dependency-check-report.xml'
            }
        }


        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQube-Scanner'
                    withSonarQubeEnv('SonarQube-Server') {
                        sh """
                            source venv/bin/activate
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=htom-pushdep \
                            -Dsonar.projectName=htom \
                            -Dsonar.projectVersion=1.0 \
                            -Dsonar.sources=. \
                            -Dsonar.language=py \
                            -Dsonar.sourceEncoding=UTF-8 \
                            -Dsonar.python.coverage.reportPaths=coverage.xml \
                            -Dsonar.exclusions=**/venv/**,**/__pycache__/**,**/node_modules/**,**/.git/**,**/tests/**,**/*.pyc,**/migrations/**,**/static/**,**/templates/**,**/*.html,**/*.css,**/*.js
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def dockerImage = docker.build("${ARTIFACT_REGISTRY_REPO}:${env.BUILD_NUMBER}")
                    dockerImage.tag("latest")

                    echo "Docker image built: ${ARTIFACT_REGISTRY_REPO}:${env.BUILD_NUMBER}"
                    echo "Docker image tagged as: ${ARTIFACT_REGISTRY_REPO}:latest"
                }
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                withCredentials([file(credentialsId: GCLOUD_CREDENTIALS, variable: 'GCLOUD_SERVICE_KEY')]) {
                    sh '''
                        # Authenticate with Google Cloud
                        gcloud auth activate-service-account --key-file=${GCLOUD_SERVICE_KEY}
                        gcloud config set project ${GCP_PROJECT_ID}

                        # Configure Docker for Artifact Registry
                        gcloud auth configure-docker us-central1-docker.pkg.dev

                        # Push both images
                        docker push ${ARTIFACT_REGISTRY_REPO}:${BUILD_NUMBER}
                        docker push ${ARTIFACT_REGISTRY_REPO}:latest

                        echo "Docker images pushed to Artifact Registry"
                    '''
                }
            }
        }

        stage('Deploy to Google Cloud Run') {
            steps {
                withCredentials([file(credentialsId: GCLOUD_CREDENTIALS, variable: 'GCLOUD_SERVICE_KEY')]) {
                    sh '''
                        # Authenticate with Google Cloud
                        gcloud auth activate-service-account --key-file=${GCLOUD_SERVICE_KEY}
                        gcloud config set project ${GCP_PROJECT_ID}

                        # Deploy to Cloud Run using Artifact Registry image
                        gcloud run deploy ${CLOUD_RUN_SERVICE} \
                            --image=${ARTIFACT_REGISTRY_REPO}:${BUILD_NUMBER} \
                            --platform=managed \
                            --region=${GCP_REGION} \
                            --allow-unauthenticated \
                            --port=8080 \
                            --memory=512Mi \
                            --cpu=1000m \
                            --max-instances=10 \
                            --timeout=300

                        # Get the service URL
                        SERVICE_URL=$(gcloud run services describe ${CLOUD_RUN_SERVICE} --region=${GCP_REGION} --format="value(status.url)")
                        echo "Application deployed successfully!"
                        echo "Service URL: ${SERVICE_URL}"
                    '''
                }
            }
        }

        stage('Cleanup Local Images') {
            steps {
                sh '''
                    # Clean up local Docker images to save space
                    docker rmi ${GCR_REPOSITORY}:${BUILD_NUMBER} || true
                    docker rmi ${GCR_REPOSITORY}:latest || true
                    echo "Local Docker images cleaned up"
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed'

            // Publish OWASP report
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: './',
                reportFiles: 'dependency-check-report.html',
                reportName: 'OWASP Dependency Check Report'
            ])

            // Clean up virtual environment
            sh 'rm -rf venv || true'
        }

        success {
            echo 'Pipeline succeeded! Application deployed to Cloud Run.'
            script {
                // Display deployment information
                echo "✅ Deployment successful!"
                echo "🐳 Docker Image: ${DOCKER_REPOSITORY}:${env.BUILD_NUMBER}"
                echo "☁️ Cloud Run Service: ${CLOUD_RUN_SERVICE}"
                echo "🌍 Region: ${GCP_REGION}"
                echo "🔗 Expected URL: https://${CLOUD_RUN_SERVICE}-${GCP_REGION}-${GCP_PROJECT_ID}.a.run.app"
            }
        }

        failure {
            echo 'Pipeline failed!'
            echo 'Check the logs above for error details.'
        }
    }
}
